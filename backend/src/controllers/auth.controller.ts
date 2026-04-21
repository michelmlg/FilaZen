import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { Role } from '@prisma/client'

export const login = async (req: Request, res: Response) => {
  const { email, tenantSlug, password } = req.body

  if (!email || !tenantSlug || !password) {
    throw new AppError('Email, slug do tenant e senha são obrigatórios.')
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant || !tenant.active) {
    throw new AppError('Tenant não encontrado ou inativo.', 404)
  }

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    include: { status: true },
  })

  if (!user || !user.active) {
    throw new AppError('Credenciais inválidas.', 401)
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    throw new AppError('Credenciais inválidas.', 401)
  }

  const secret = process.env.JWT_SECRET!
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, tenantSlug: tenant.slug, role: user.role, email: user.email, name: user.name },
    secret,
    { expiresIn } as jwt.SignOptions
  )

  // Audit log
  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  })

  const { passwordHash: _, ...userWithoutPassword } = user

  return res.json({ token, user: userWithoutPassword })
}

export const register = async (req: Request, res: Response) => {
  const { name, email, password, tenantSlug, role } = req.body

  if (!name || !email || !password || !tenantSlug) {
    throw new AppError('Todos os campos são obrigatórios.')
  }

  if (password.length < 8) {
    throw new AppError('A senha deve ter pelo menos 8 caracteres.')
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new AppError('A senha deve conter letras maiúsculas, minúsculas e números.')
  }

  let tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  let finalRole = role === 'MANAGER' ? 'MANAGER' : 'SELLER'
  
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantSlug,
        slug: tenantSlug,
        active: true
      }
    })
    finalRole = 'ADMIN'
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name,
      email,
      passwordHash,
      role: finalRole as Role,
    },
  })

  const { passwordHash: _, ...userWithoutPassword } = user
  return res.status(201).json(userWithoutPassword)
}

export const me = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    include: { status: true },
    omit: { passwordHash: true },
  })

  if (!user) throw new AppError('Usuário não encontrado.', 404)
  return res.json(user)
}
