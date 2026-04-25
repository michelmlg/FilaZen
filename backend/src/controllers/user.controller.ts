import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { emitToTenant } from '../services/socket.service'
import { Role } from '@prisma/client'

export const listUsers = async (req: Request, res: Response) => {
  const { tenantId } = req.user!

  // Busca usuários que possuem vínculo com este tenant
  const users = await prisma.user.findMany({
    where: {
      tenants: {
        some: { tenantId, active: true }
      }
    },
    include: { 
      tenants: {
        where: { tenantId },
        include: { status: true }
      }
    },
    omit: { passwordHash: true },
    orderBy: { name: 'asc' },
  })

  // Achata o role e status do pivot para o objeto de resposta
  const flattenedUsers = users.map(u => ({
    ...u,
    role: u.tenants[0]?.role,
    isOwner: u.tenants[0]?.isOwner,
    active: u.tenants[0]?.active,
    status: u.tenants[0]?.status || null,
    tenants: undefined
  }))

  return res.json(flattenedUsers)
}

export const getUser = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const targetUserId = req.params.id as string

  const user = await prisma.user.findFirst({
    where: { 
      id: targetUserId,
      tenants: { some: { tenantId, active: true } }
    },
    include: { 
      performances: { orderBy: { periodStart: 'desc' }, take: 6 },
      tenants: {
        where: { tenantId },
        include: { status: true }
      }
    },
    omit: { passwordHash: true },
  })

  if (!user) throw new AppError('Usuário não encontrado na organização.', 404)

  const membership = user.tenants[0]
  const { tenants: _, ...userBase } = user

  return res.json({
    ...userBase,
    role: membership?.role,
    isOwner: membership?.isOwner,
    active: membership?.active,
    status: membership?.status || null
  })
}

export const createUser = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId, role: requestingUserRole } = req.user!
  const { name, email, role } = req.body as {
    name: string
    email: string
    role?: 'ADMIN' | 'MANAGER' | 'SELLER'
  }

  if (!name || !email) {
    throw new AppError('Nome e email são obrigatórios.')
  }

  if (requestingUserRole !== 'ADMIN') {
    throw new AppError('Apenas administradores podem convidar usuários.')
  }

  // Verifica se o usuário já tem vínculo com este tenant
  const existingMembership = await prisma.tenantUser.findFirst({
    where: { tenantId, user: { email } }
  })

  if (existingMembership) {
    throw new AppError('Este usuário já faz parte desta organização.')
  }

  let finalRole = role && ['ADMIN', 'MANAGER', 'SELLER'].includes(role) ? role : 'SELLER'
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const availableStatus = await prisma.userStatus.findFirst({
    where: {
      tenantId,
      meaning: 'AVAILABLE',
      active: true
    }
  })

  // Tenta encontrar usuário global existente ou cria um novo
  const result = await prisma.$transaction(async (tx) => {
    let globalUser = await tx.user.findUnique({ where: { email } })

    if (globalUser) {
      // Se já existe, apenas atualiza o status se necessário (opcional)
      // globalUser = await tx.user.update({ where: { id: globalUser.id }, data: { statusId: globalUser.statusId || availableStatus?.id } })
    } else {
      globalUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          statusId: availableStatus?.id
        }
      })
    }

    const membership = await tx.tenantUser.create({
      data: {
        userId: globalUser.id,
        tenantId,
        role: finalRole as Role,
        isCreatedFromTenant: true
      }
    })

    return { user: globalUser, membership }
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'CREATE',
      entity: 'User',
      entityId: result.user.id,
      newData: { name, email, role: finalRole },
    },
  })

  return res.status(201).json({
    user: {
      ...result.user,
      passwordHash: undefined,
      role: result.membership.role
    },
    tempPassword: result.user.id === requestingUserId ? undefined : tempPassword,
    message: 'Usuário adicionado à organização.',
  })
}

export const updateUser = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId } = req.user!
  const { name, avatarUrl } = req.body
  const targetUserId = req.params.id as string

  // Verifica se pertence ao tenant
  const membership = await prisma.tenantUser.findUnique({
    where: { userId_tenantId: { userId: targetUserId, tenantId } }
  })

  if (!membership) throw new AppError('Usuário não pertence a esta organização.', 404)

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { name, avatarUrl },
    omit: { passwordHash: true },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'UPDATE',
      entity: 'User',
      entityId: targetUserId,
      newData: { name, avatarUrl },
    },
  })

  return res.json(updatedUser)
}

export const updateRole = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId, role: requestingRole } = req.user!
  const { role } = req.body as { role: 'ADMIN' | 'MANAGER' | 'SELLER' }

  if (requestingRole !== 'ADMIN') {
    throw new AppError('Apenas administradores podem alterar cargos.')
  }

  const targetUserId = req.params.id as string

  const targetMembership = await prisma.tenantUser.findUnique({
    where: { userId_tenantId: { userId: targetUserId, tenantId } }
  })

  if (!targetMembership) {
    throw new AppError('Usuário não encontrado nesta organização.', 404)
  }

  if (targetMembership.isOwner && requestingUserId !== targetUserId) {
    throw new AppError('Não é possível alterar o cargo do proprietário.')
  }

  const updatedMembership = await prisma.tenantUser.update({
    where: { id: targetMembership.id },
    data: { role: role as Role },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'UPDATE',
      entity: 'TenantUser',
      entityId: targetUserId,
      oldData: { role: targetMembership.role },
      newData: { role },
    },
  })

  return res.json({ userId: targetUserId, role: updatedMembership.role })
}

export const updateStatus = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { statusId } = req.body
  const targetUserId = req.params.id as string

  if (!statusId) throw new AppError('StatusId é obrigatório.')

  // Verifica se o status pertence ao tenant
  const status = await prisma.userStatus.findFirst({
    where: { id: statusId, tenantId },
  })
  if (!status) throw new AppError('Status não encontrado para este tenant.', 404)

  // Verifica vínculo
  const membership = await prisma.tenantUser.findUnique({
    where: { userId_tenantId: { userId: targetUserId, tenantId } },
    include: { user: { omit: { passwordHash: true } }, status: true }
  })

  if (!membership) throw new AppError('Usuário não pertence a esta organização.', 404)

  // Atualiza status no membership
  const updated = await prisma.tenantUser.update({
    where: { id: membership.id },
    data: { statusId },
    include: { status: true, user: { omit: { passwordHash: true } } }
  })

  emitToTenant(tenantId, 'user:status_changed', {
    userId: updated.userId,
    name: updated.user.name,
    status: updated.status?.name,
  })

  return res.json({
    userId: updated.user.id,
    name: updated.user.name,
    role: updated.role,
    status: updated.status
  })
}

export const resetPassword = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId, role: requestingRole } = req.user!
  const targetUserId = req.params.id as string

  if (requestingRole !== 'ADMIN') {
    throw new AppError('Apenas administradores podem resetar senhas.')
  }

  const membership = await prisma.tenantUser.findUnique({
    where: { userId_tenantId: { userId: targetUserId, tenantId } }
  })

  if (!membership) {
    throw new AppError('Usuário não encontrado nesta organização.', 404)
  }

  const newPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'UPDATE',
      entity: 'User',
      entityId: targetUserId,
      newData: { action: 'password_reset' },
    },
  })

  return res.json({
    message: 'Senha resetada com sucesso.',
    tempPassword: newPassword,
  })
}

export const deleteUser = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId, role: requestingRole } = req.user!
  const targetUserId = req.params.id as string

  if (requestingRole !== 'ADMIN') {
    throw new AppError('Apenas administradores podem remover membros.')
  }

  const targetMembership = await prisma.tenantUser.findUnique({
    where: { userId_tenantId: { userId: targetUserId, tenantId } }
  })

  if (!targetMembership) {
    throw new AppError('Membro não encontrado.', 404)
  }

  if (targetMembership.isOwner) {
    throw new AppError('Não é possível remover o proprietário da organização.')
  }

  if (targetUserId === requestingUserId) {
    throw new AppError('Você não pode remover a si mesmo.')
  }

  // Remove apenas o vínculo
  await prisma.tenantUser.update({
    where: { id: targetMembership.id },
    data: { active: false },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'DELETE',
      entity: 'TenantUser',
      entityId: targetUserId,
    },
  })

  return res.status(204).send()
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
