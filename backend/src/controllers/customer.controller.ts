import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'

export const listCustomers = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { search, type, tagId } = req.query

  const customers = await prisma.customer.findMany({
    where: {
      tenantId,
      active: true,
      ...(type ? { type: type as any } : {}),
      ...(search ? {
        OR: [
          { name: { contains: String(search), mode: 'insensitive' } },
          { email: { contains: String(search), mode: 'insensitive' } },
          { cpf: { contains: String(search) } },
          { cnpj: { contains: String(search) } },
        ],
      } : {}),
      ...(tagId ? { tags: { some: { tagId: String(tagId) } } } : {}),
    },
    include: {
      tags: { include: { tag: true } },
      _count: { select: { tickets: true } },
    },
    orderBy: { name: 'asc' },
  })

  return res.json(customers)
}

export const getCustomer = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const customer = await prisma.customer.findFirst({
    where: { id: req.params.id as string, tenantId },
    include: {
      tags: { include: { tag: true } },
      tickets: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { omit: { passwordHash: true } } },
      },
    },
  })
  if (!customer) throw new AppError('Cliente não encontrado.', 404)
  return res.json(customer)
}

export const createCustomer = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { tagIds, ...data } = req.body

  if (tagIds?.length) {
    const validTags = await prisma.tag.findMany({
      where: { id: { in: tagIds }, tenantId },
      select: { id: true },
    })
    if (validTags.length !== tagIds.length) {
      throw new AppError('Uma ou mais tags não pertencem a este tenant.', 400)
    }
  }

  const customer = await prisma.customer.create({
    data: {
      ...data,
      tenantId,
      ...(tagIds?.length ? {
        tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
      } : {}),
    },
    include: { tags: { include: { tag: true } } },
  })

  return res.status(201).json(customer)
}

export const updateCustomer = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { tagIds, ...data } = req.body

  const existing = await prisma.customer.findFirst({
    where: { id: req.params.id as string, tenantId },
  })
  if (!existing) throw new AppError('Cliente não encontrado.', 404)

  if (tagIds !== undefined && tagIds?.length) {
    const validTags = await prisma.tag.findMany({
      where: { id: { in: tagIds }, tenantId },
      select: { id: true },
    })
    if (validTags.length !== tagIds.length) {
      throw new AppError('Uma ou mais tags não pertencem a este tenant.', 400)
    }
  }

  const customer = await prisma.customer.update({
    where: { id: req.params.id as string, tenantId },
    data: {
      ...data,
      ...(tagIds !== undefined ? {
        tags: {
          deleteMany: {},
          create: tagIds?.map((tagId: string) => ({ tagId })) || [],
        },
      } : {}),
    },
    include: { tags: { include: { tag: true } } },
  })

  return res.json(customer)
}

export const deleteCustomer = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  await prisma.customer.update({
    where: { id: req.params.id as string, tenantId },
    data: { active: false },
  })
  return res.status(204).send()
}
