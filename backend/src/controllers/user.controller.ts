import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { emitToTenant } from '../services/socket.service'
import { Role } from '@prisma/client'

export const listUsers = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const users = await prisma.user.findMany({
    where: { tenantId },
    include: { status: true },
    omit: { passwordHash: true },
    orderBy: [{ queuePosition: 'asc' }, { name: 'asc' }],
  })
  return res.json(users)
}

export const getUser = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const user = await prisma.user.findFirst({
    where: { id: req.params.id as string, tenantId },
    include: { status: true, performances: { orderBy: { periodStart: 'desc' }, take: 6 } },
    omit: { passwordHash: true },
  })
  if (!user) throw new AppError('Usuário não encontrado.', 404)
  return res.json(user)
}

export const createUser = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId } = req.user!
  const { name, email, role } = req.body as {
    name: string
    email: string
    role?: 'ADMIN' | 'MANAGER' | 'SELLER'
  }

  if (!name || !email) {
    throw new AppError('Nome e email são obrigatórios.')
  }

  if (!email.includes('@')) {
    throw new AppError('Email inválido.')
  }

  const existingUser = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId, email } },
  })

  if (existingUser) {
    throw new AppError('Já existe um usuário com este email neste tenant.')
  }

  let finalRole = role === 'MANAGER' ? 'MANAGER' : 'SELLER'

  const tempPassword = generateTempPassword()

  const passwordHash = await bcrypt.hash(tempPassword, 12)

  const availableStatus = await prisma.userStatus.findFirst({
    where: {
      tenantId,
      meaning: 'AVAILABLE',
      active: true
    }
  })

  const user = await prisma.user.create({
    data: {
      tenantId,
      name,
      email,
      passwordHash,
      role: finalRole as Role,
      active: true,
      statusId: availableStatus?.id,
    },
    include: { status: true },
    omit: { passwordHash: true },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      newData: { name, email, role: finalRole },
    },
  })

  return res.status(201).json({
    user,
    tempPassword,
    message: 'Usuário criado com sucesso. A senha temporária deve ser fornecida ao usuário.',
  })
}

export const updateUser = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId } = req.user!
  const { name, avatarUrl } = req.body

  const user = await prisma.user.update({
    where: { id: req.params.id as string, tenantId },
    data: { name, avatarUrl },
    include: { status: true },
    omit: { passwordHash: true },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      newData: { name, avatarUrl },
    },
  })

  return res.json(user)
}

export const updateRole = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId } = req.user!
  const { role } = req.body as { role: 'MANAGER' | 'SELLER' }

  if (!role || !['MANAGER', 'SELLER'].includes(role)) {
    throw new AppError('Cargo inválido. Use MANAGER ou SELLER.')
  }

  const targetUserId = req.params.id as string

  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId },
  })

  if (requestingUser?.role !== 'ADMIN') {
    throw new AppError('Apenas administradores podem alterar cargos.')
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, tenantId },
  })

  if (!targetUser) {
    throw new AppError('Usuário não encontrado.', 404)
  }

  if (targetUser.role === 'ADMIN') {
    throw new AppError('Não é possível alterar o cargo do administrador.')
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { role: role as Role },
    include: { status: true },
    omit: { passwordHash: true },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'UPDATE',
      entity: 'User',
      entityId: targetUserId,
      oldData: { role: targetUser.role },
      newData: { role },
    },
  })

  return res.json(updatedUser)
}

export const updateStatus = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { statusId } = req.body

  if (!statusId) throw new AppError('StatusId é obrigatório.')

  const status = await prisma.userStatus.findFirst({
    where: { id: statusId, tenantId },
  })
  if (!status) throw new AppError('Status não encontrado.', 404)

  const user = await prisma.user.update({
    where: { id: req.params.id as string, tenantId },
    data: { statusId },
    include: { status: true },
    omit: { passwordHash: true },
  })

  emitToTenant(tenantId, 'user:status_changed', {
    userId: user.id,
    name: user.name,
    status: user.status?.name,
  })

  return res.json(user)
}

export const resetPassword = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId } = req.user!
  const targetUserId = req.params.id as string

  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId },
  })

  if (requestingUser?.role !== 'ADMIN') {
    throw new AppError('Apenas administradores podem resetar senhas.')
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, tenantId },
  })

  if (!targetUser) {
    throw new AppError('Usuário não encontrado.', 404)
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
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
    },
  })
}

export const deleteUser = async (req: Request, res: Response) => {
  const { tenantId, userId: requestingUserId } = req.user!
  const targetUserId = req.params.id as string

  const requestingUser = await prisma.user.findUnique({
    where: { id: requestingUserId },
  })

  if (requestingUser?.role !== 'ADMIN') {
    throw new AppError('Apenas administradores podem excluir usuários.')
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: targetUserId, tenantId },
  })

  if (!targetUser) {
    throw new AppError('Usuário não encontrado.', 404)
  }

  if (targetUser.role === 'ADMIN') {
    throw new AppError('Não é possível excluir o administrador.')
  }

  if (targetUserId === requestingUserId) {
    throw new AppError('Você não pode excluir seu próprio usuário.')
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { active: false },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: requestingUserId,
      action: 'DELETE',
      entity: 'User',
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
