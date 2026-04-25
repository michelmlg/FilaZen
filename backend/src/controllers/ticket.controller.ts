import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { emitToTenant } from '../services/socket.service'

const getNextTicketNumber = async (tenantId: string): Promise<number> => {
  const last = await prisma.ticket.findFirst({
    where: { tenantId },
    orderBy: { number: 'desc' },
    select: { number: true },
  })
  return (last?.number ?? 0) + 1
}

export const listTickets = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { status, tenantUserId, customerId } = req.query

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as any } : {}),
      ...(tenantUserId ? { tenantUserId: String(tenantUserId) } : {}),
      ...(customerId ? { customerId: String(customerId) } : {}),
    },
    include: {
      tenantUser: {
        include: {
          user: { omit: { passwordHash: true } }
        }
      },
      customer: true,
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const flattenedTickets = tickets.map(t => ({
    ...t,
    userId: t.tenantUser?.userId,
    user: t.tenantUser ? {
      id: t.tenantUser.user.id,
      name: t.tenantUser.user.name,
      email: t.tenantUser.user.email,
      avatarUrl: t.tenantUser.user.avatarUrl,
      role: t.tenantUser.role
    } : null,
    tenantUser: undefined
  }))

  return res.json(flattenedTickets)
}

export const getTicket = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id as string, tenantId },
    include: {
      tenantUser: {
        include: {
          user: { omit: { passwordHash: true } }
        }
      },
      customer: { include: { tags: { include: { tag: true } } } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!ticket) throw new AppError('Ticket não encontrado.', 404)

  const flattened = {
    ...ticket,
    userId: ticket.tenantUser?.userId,
    user: ticket.tenantUser ? {
      id: ticket.tenantUser.user.id,
      name: ticket.tenantUser.user.name,
      email: ticket.tenantUser.user.email,
      avatarUrl: ticket.tenantUser.user.avatarUrl,
      role: ticket.tenantUser.role
    } : null,
    tenantUser: undefined
  }
  return res.json(flattened)
}

export const createTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { customerId, title, description, estimatedValue, metadata } = req.body

  const membership = await prisma.tenantUser.findFirst({
    where: { tenantId, userId },
    select: { id: true }
  })

  if (!membership) {
    throw new AppError('Usuário não vinculado a esta organização.', 404)
  }

  const number = await getNextTicketNumber(tenantId)

  const ticket = await prisma.ticket.create({
    data: {
      tenantId,
      number,
      title,
      description,
      estimatedValue,
      metadata,
      tenantUserId: membership.id,
      customerId,
      status: 'IN_PROGRESS',
      acceptedAt: new Date(),
    },
    include: {
      tenantUser: {
        include: { user: { omit: { passwordHash: true } } }
      },
      customer: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Ticket',
      entityId: ticket.id,
      newData: ticket as any,
    },
  })

  emitToTenant(tenantId, 'ticket:created', ticket)

  const flattened = {
    ...ticket,
    userId: ticket.tenantUser?.userId,
    user: ticket.tenantUser ? {
      id: ticket.tenantUser.user.id,
      name: ticket.tenantUser.user.name,
      email: ticket.tenantUser.user.email,
      avatarUrl: ticket.tenantUser.user.avatarUrl,
      role: ticket.tenantUser.role
    } : null,
    tenantUser: undefined
  }
  return res.status(201).json(flattened)
}

export const updateTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { title, description, estimatedValue, finalValue, customerId, metadata } = req.body

  const old = await prisma.ticket.findFirst({ where: { id: req.params.id as string, tenantId } })
  if (!old) throw new AppError('Ticket não encontrado.', 404)

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id as string, tenantId },
    data: { title, description, estimatedValue, finalValue, customerId, metadata },
    include: {
      tenantUser: {
        include: { user: { omit: { passwordHash: true } } }
      },
      customer: true
    },
  })

  await prisma.auditLog.create({
    data: {
      tenantId, userId,
      action: 'UPDATE', entity: 'Ticket', entityId: ticket.id,
      oldData: old as any, newData: ticket as any,
    },
  })

  emitToTenant(tenantId, 'ticket:updated', ticket)

  const flattened = {
    ...ticket,
    userId: ticket.tenantUser?.userId,
    user: ticket.tenantUser ? {
      id: ticket.tenantUser.user.id,
      name: ticket.tenantUser.user.name,
      email: ticket.tenantUser.user.email,
      avatarUrl: ticket.tenantUser.user.avatarUrl,
      role: ticket.tenantUser.role
    } : null,
    tenantUser: undefined
  }
  return res.json(flattened)
}

export const acceptTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const membership = await prisma.tenantUser.findFirst({
    where: { tenantId, userId },
    select: { id: true }
  })

  if (!membership) {
    throw new AppError('Usuário não vinculado a esta organização.', 404)
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id as string, tenantId },
    data: { status: 'IN_PROGRESS', tenantUserId: membership.id, acceptedAt: new Date() },
    include: {
      tenantUser: {
        include: { user: { omit: { passwordHash: true } } }
      },
      customer: true
    },
  })

  await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, type: 'STATUS_CHANGE', content: 'Ticket assumido pelo vendedor.', data: { userId } },
  })

  emitToTenant(tenantId, 'ticket:accepted', ticket)

  const flattened = {
    ...ticket,
    userId: ticket.tenantUser?.userId,
    user: ticket.tenantUser ? {
      id: ticket.tenantUser.user.id,
      name: ticket.tenantUser.user.name,
      email: ticket.tenantUser.user.email,
      avatarUrl: ticket.tenantUser.user.avatarUrl,
      role: ticket.tenantUser.role
    } : null,
    tenantUser: undefined
  }
  return res.json(flattened)
}

export const closeTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { finalValue, status } = req.body

  const finalStatus = status === 'CANCELLED' ? 'CANCELLED' : 'DONE'

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id as string, tenantId },
    data: {
      status: finalStatus,
      finalValue,
      ...(finalStatus === 'DONE' ? { completedAt: new Date() } : { cancelledAt: new Date() }),
    },
    include: {
      tenantUser: {
        include: { user: { omit: { passwordHash: true } } }
      },
      customer: true
    },
  })

  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      type: 'STATUS_CHANGE',
      content: `Ticket encerrado como ${finalStatus}.`,
      data: { finalStatus, finalValue },
    },
  })

  await prisma.auditLog.create({
    data: { tenantId, userId, action: 'UPDATE', entity: 'Ticket', entityId: ticket.id, newData: { status: finalStatus } as any },
  })

  emitToTenant(tenantId, 'ticket:closed', ticket)

  const flattened = {
    ...ticket,
    userId: ticket.tenantUser?.userId,
    user: ticket.tenantUser ? {
      id: ticket.tenantUser.user.id,
      name: ticket.tenantUser.user.name,
      email: ticket.tenantUser.user.email,
      avatarUrl: ticket.tenantUser.user.avatarUrl,
      role: ticket.tenantUser.role
    } : null,
    tenantUser: undefined
  }
  return res.json(flattened)
}

export const addEvent = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { type, content, data } = req.body

  const ticket = await prisma.ticket.findFirst({ where: { id: req.params.id as string, tenantId } })
  if (!ticket) throw new AppError('Ticket não encontrado.', 404)

  const event = await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, type, content, data },
  })

  return res.status(201).json(event)
}