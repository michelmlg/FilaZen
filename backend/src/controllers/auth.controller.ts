import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { Role } from '@prisma/client'

// ─── Login simplificado (apenas email + senha) ────────────────
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new AppError('Email e senha são obrigatórios.')
  }

  // Busca o usuário global pelo email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user || !user.active) {
    throw new AppError('Credenciais inválidas.', 401)
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    throw new AppError('Credenciais inválidas.', 401)
  }

  // Busca todos os vínculos (tenants) deste usuário
  const memberships = await prisma.tenantUser.findMany({
    where: { userId: user.id, active: true },
    include: { tenant: true },
  })

  const activeMemberships = memberships.filter(m => m.tenant.active)

  if (activeMemberships.length === 0) {
    throw new AppError('Usuário não possui organizações ativas.', 401)
  }

  // Se pertence a apenas 1 tenant → login direto
  if (activeMemberships.length === 1) {
    const membership = activeMemberships[0]
    const token = generateToken({
      ...user,
      role: membership.role,
      tenantId: membership.tenantId,
      tenant: { slug: membership.tenant.slug }
    })

    await createLoginAudit(membership, req)

    const { passwordHash: _, ...userWithoutPassword } = user
    return res.json({ 
      token, 
      user: {
        ...userWithoutPassword,
        role: membership.role,
        tenantId: membership.tenantId,
        isOwner: membership.isOwner
      } 
    })
  }

  // Se pertence a múltiplos tenants → retorna lista para seleção
  const tenants = activeMemberships.map((m) => ({
    id: m.tenant.id,
    name: m.tenant.name,
    slug: m.tenant.slug,
    logoUrl: m.tenant.logoUrl,
    role: m.role,
    isOwner: m.isOwner,
  }))

  return res.json({ tenants, needsSelection: true })
}

// ─── Selecionar tenant (fluxo multi-tenant) ────────────────
export const selectTenant = async (req: Request, res: Response) => {
  const { email, password, tenantSlug } = req.body

  if (!email || !password || !tenantSlug) {
    throw new AppError('Email, senha e slug do tenant são obrigatórios.')
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.active) {
    throw new AppError('Credenciais inválidas.', 401)
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    throw new AppError('Credenciais inválidas.', 401)
  }

  const membership = await prisma.tenantUser.findFirst({
    where: { 
      userId: user.id, 
      tenant: { slug: tenantSlug },
      active: true 
    },
    include: { tenant: true }
  })

  if (!membership || !membership.tenant.active) {
    throw new AppError('Vínculo com organização não encontrado ou inativo.', 401)
  }

  const token = generateToken({
    ...user,
    role: membership.role,
    tenantId: membership.tenantId,
    tenant: { slug: membership.tenant.slug }
  })

  await createLoginAudit(membership, req)

  const { passwordHash: _, ...userWithoutPassword } = user
  return res.json({ 
    token, 
    user: {
      ...userWithoutPassword,
      role: membership.role,
      tenantId: membership.tenantId,
      isOwner: membership.isOwner
    } 
  })
}

// ─── Registro (wizard) ────────────────
export const register = async (req: Request, res: Response) => {
  const {
    tenantName,
    tenantSlug,
    name,
    email,
    password,
    industry,
    source,
    companySize,
    phone,
  } = req.body

  if (!tenantName || !tenantSlug || !name || !email || !password) {
    throw new AppError('Todos os campos obrigatórios devem ser preenchidos.')
  }

  // Validação básica de senha
  if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new AppError('Senha fraca demais.', 400)
  }

  // Verifica se slug já existe
  const existingTenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (existingTenant) {
    throw new AppError('Este slug de empresa já está em uso.', 409)
  }

  // Se o usuário já existe, ele apenas ganhará um novo vínculo
  let user = await prisma.user.findUnique({ where: { email } })
  
  const passwordHash = await bcrypt.hash(password, 12)

  const result = await prisma.$transaction(async (tx) => {
    // 1. Cria usuário se não existir
    if (!user) {
      user = await tx.user.create({
        data: { name, email, passwordHash },
      })
    }

    // 2. Cria Tenant
    const tenant = await tx.tenant.create({
      data: { name: tenantName, slug: tenantSlug },
    })

    // 3. Cria vínculo (TenantUser) como OWNER e ADMIN
    const membership = await tx.tenantUser.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: 'ADMIN' as Role,
        isOwner: true,
        isCreatedFromTenant: false,
      }
    })

    // 4. Cria Lead info
    await tx.tenantLead.create({
      data: {
        tenantId: tenant.id,
        industry: industry || null,
        source: source || null,
        companySize: companySize || null,
        phone: phone || null,
      },
    })

    return { user, tenant, membership }
  })

  const { passwordHash: _, ...userWithoutPassword } = result.user
  return res.status(201).json({
    ...userWithoutPassword,
    role: result.membership.role,
    tenantId: result.membership.tenantId,
    isOwner: result.membership.isOwner
  })
}

// ─── Me ────────────────
export const me = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.user!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { 
      tenants: {
        where: { tenantId, active: true },
        include: { status: true }
      }
    },
    omit: { passwordHash: true },
  })

  if (!user) throw new AppError('Usuário não encontrado.', 404)
  
  const membership = user.tenants[0]
  if (!membership) throw new AppError('Usuário não vinculado a esta organização.', 401)

  const { tenants: _, ...userBase } = user

  return res.json({
    ...userBase,
    role: membership.role,
    tenantId: membership.tenantId,
    isOwner: membership.isOwner,
    status: membership.status
  })
}

// ─── Helpers ────────────────
function generateToken(data: { id: string; tenantId: string; role: Role; email: string; name: string; tenant: { slug: string } }) {
  const secret = process.env.JWT_SECRET!
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'

  return jwt.sign(
    {
      userId: data.id,
      tenantId: data.tenantId,
      tenantSlug: data.tenant.slug,
      role: data.role,
      email: data.email,
      name: data.name,
    },
    secret,
    { expiresIn } as jwt.SignOptions,
  )
}

async function createLoginAudit(membership: { userId: string; tenantId: string }, req: Request) {
  await prisma.auditLog.create({
    data: {
      tenantId: membership.tenantId,
      userId: membership.userId,
      action: 'LOGIN',
      entity: 'User',
      entityId: membership.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  })
}

