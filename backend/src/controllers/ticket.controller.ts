import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { emitToTenant } from '../services/socket.service'

// Helper para gerar próximo número sequencial de ticket por tenant
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
  const { status, userId, customerId } = req.query

  const tickets = await prisma.ticket.findMany({
    where: {
      tenantId,
      ...(status ? { status: status as any } : {}),
      ...(userId ? { userId: String(userId) } : {}),
      ...(customerId ? { customerId: String(customerId) } : {}),
    },
    include: {
      user: { omit: { passwordHash: true } },
      customer: true,
      _count: { select: { events: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return res.json(tickets)
}

export const getTicket = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const ticket = await prisma.ticket.findFirst({
    where: { id: req.params.id as string, tenantId },
    include: {
      user: { omit: { passwordHash: true } },
      customer: { include: { tags: { include: { tag: true } } } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!ticket) throw new AppError('Ticket não encontrado.', 404)
  return res.json(ticket)
}

export const createTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { customerId, title, description, estimatedValue, metadata } = req.body

  const number = await getNextTicketNumber(tenantId)

  const ticket = await prisma.ticket.create({
    data: {
      tenantId,
      number,
      title,
      description,
      estimatedValue,
      metadata,
      userId,
      customerId,
      status: 'IN_PROGRESS',
      acceptedAt: new Date(),
    },
    include: {
      user: { omit: { passwordHash: true } },
      customer: true,
    },
  })

  // Audit log
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

  // Emite novo ticket para o tenant
  emitToTenant(tenantId, 'ticket:created', ticket)

  return res.status(201).json(ticket)
}

export const updateTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { title, description, estimatedValue, finalValue, customerId, metadata } = req.body

  const old = await prisma.ticket.findFirst({ where: { id: req.params.id as string, tenantId } })
  if (!old) throw new AppError('Ticket não encontrado.', 404)

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id as string, tenantId },
    data: { title, description, estimatedValue, finalValue, customerId, metadata },
    include: { user: { omit: { passwordHash: true } }, customer: true },
  })

  await prisma.auditLog.create({
    data: {
      tenantId, userId,
      action: 'UPDATE', entity: 'Ticket', entityId: ticket.id,
      oldData: old as any, newData: ticket as any,
    },
  })

  emitToTenant(tenantId, 'ticket:updated', ticket)
  return res.json(ticket)
}

export const acceptTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id as string, tenantId },
    data: { status: 'IN_PROGRESS', userId, acceptedAt: new Date() },
    include: { user: { omit: { passwordHash: true } }, customer: true },
  })

  await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, type: 'STATUS_CHANGE', content: 'Ticket assumido pelo vendedor.', data: { userId } },
  })

  emitToTenant(tenantId, 'ticket:accepted', ticket)
  return res.json(ticket)
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
    include: { user: { omit: { passwordHash: true } }, customer: true },
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
  return res.json(ticket)
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
