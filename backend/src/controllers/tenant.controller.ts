import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'

export const checkSlug = async (req: Request, res: Response) => {
  const slug = req.params.slug as string

  if (!slug || slug.length < 3) {
    return res.json({ available: false, message: 'Slug deve ter pelo menos 3 caracteres.' })
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } })
  return res.json({ available: !existing })
}

export const getTenant = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
    },
  })
  
  if (!tenant) {
    throw new AppError('Tenant não encontrado.', 404)
  }
  
  const primaryColorSetting = await prisma.tenantSetting.findUnique({
    where: {
      tenantId_key: {
        tenantId,
        key: 'tenant_primary_color',
      },
    },
  })
  
  return res.json({
    ...tenant,
    primaryColor: primaryColorSetting?.value || '#3b82f6',
  })
}

export const getTenantSettings = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const settings = await prisma.tenantSetting.findMany({ where: { tenantId } })
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]))
  return res.json(settingsMap)
}

export const updateTenantSettings = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const settings: Record<string, unknown> = req.body

  const keyMap: Record<string, string> = {
    name: 'tenant_name',
    primaryColor: 'tenant_primary_color',
    logoUrl: 'tenant_logo_url',
    backgroundColor: 'tenant_background_color',
  }

  const mappedSettings: Record<string, unknown> = {}
  for (const [frontendKey, value] of Object.entries(settings)) {
    const dbKey = keyMap[frontendKey] || frontendKey
    mappedSettings[dbKey] = value
  }

  const upserts = Object.entries(mappedSettings).map(([key, value]) =>
    prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key } },
      create: { tenantId, key, value: value as any },
      update: { value: value as any },
    })
  )

  await Promise.all(upserts)
  return res.json({ message: 'Configurações atualizadas.' })
}
