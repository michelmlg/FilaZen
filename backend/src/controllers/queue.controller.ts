import { Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { AppError } from '../middlewares/error.middleware'
import { emitToTenant } from '../services/socket.service'
import {
  getQueueSettings,
  updateQueueSettings,
  isWithinBusinessHours,
  getQueueSize,
  getLastQueuePosition,
  getAvailableStatus,
  getBusyStatus,
  getAwaitingStatus,
  getOfflineStatus,
  isUserInQueue,
  getUserQueuePosition,
  buildQueueSnapshot,
  getPositionMap,
  reconnectUser,
  QueueSettings,
  QueueUser
} from '../services/queue.service'
import { updateUserPerformance } from '../services/performance.service'
import { generateSnapshot, getSnapshots, getSnapshotByDate, getSnapshotWithActions, getSnapshotsInRange } from '../services/snapshot.service'

export type LockReasonType = 'MANUAL' | 'BUSINESS_HOURS' | null

export interface LockReason {
  type: LockReasonType
  message: string | null
}

export function getLockReason(settings: QueueSettings): LockReason {
  if (settings.locked) {
    return {
      type: 'MANUAL',
      message: 'Fila travada pelo administrador'
    }
  }

  if (!isWithinBusinessHours(settings)) {
    return {
      type: 'BUSINESS_HOURS',
      message: `Fila disponível apenas das ${settings.businessHoursStart} às ${settings.businessHoursEnd}.`
    }
  }

  return {
    type: null,
    message: null
  }
}

export const getQueue = async (req: Request, res: Response) => {
  const { tenantId } = req.user!

  const queue = await buildQueueSnapshot(tenantId)
  const settings = await getQueueSettings(tenantId)
  const lockReason = getLockReason(settings)

  return res.json({
    users: queue,
    total: queue.length,
    topUserId: queue.length > 0 ? queue[0].id : null,
    isLocked: lockReason.type !== null,
    reason: lockReason
  })
}

export const getQueueMe = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      queuePosition: true,
      queueEnteredAt: true,
      queueOriginalPosition: true,
      wasSkipped: true,
      isIdle: true,
      status: {
        select: {
          id: true,
          name: true,
          color: true,
          meaning: true
        }
      }
    }
  })

  if (!user) throw new AppError('Usuário não encontrado', 404)

  const settings = await getQueueSettings(tenantId)
  const lockReason = getLockReason(settings)
  const isInQueue = user.queuePosition !== null
  const isTopOfQueue = isInQueue && user.queuePosition === 1

  return res.json({
    ...user,
    isInQueue,
    isTopOfQueue,
    canOpenTicket: isTopOfQueue && lockReason.type === null,
    isLocked: lockReason.type !== null,
    lockReason
  })
}

export const reconnectQueueUser = async (req: Request, res: Response) => {
  const { userId } = req.user!

  const result = await reconnectUser(userId)

  if (!result.success) {
    // Usuário não está na fila - isso é normal quando o WebSocket reconecta
    // e o usuário não estava na fila. Não é um erro.
    return res.json({ success: true, reconnected: false })
  }

  return res.json({ success: true, reconnected: true })
}

export const joinQueue = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const settings = await getQueueSettings(tenantId)

  if (settings.locked) {
    throw new AppError('Fila travada no momento. Aguarde até que seja liberada.')
  }

  if (!isWithinBusinessHours(settings)) {
    throw new AppError(
      `Fila disponível apenas das ${settings.businessHoursStart} às ${settings.businessHoursEnd}.`
    )
  }

  const currentSize = await getQueueSize(tenantId)
  if (currentSize >= settings.maxQueueSize) {
    throw new AppError('Fila lotada. Tente novamente mais tarde.')
  }

  const alreadyIn = await isUserInQueue(userId)
  if (alreadyIn) {
    throw new AppError('Você já está na fila.')
  }

  const nextPosition = (await getLastQueuePosition(tenantId)) + 1
  const availableStatus = await getAvailableStatus(tenantId)
  const awaitingStatus = await getAwaitingStatus(tenantId)

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      queuePosition: nextPosition,
      queueEnteredAt: new Date(),
      statusId: nextPosition === 1 ? availableStatus.id : awaitingStatus.id,
      wasSkipped: false,
      skippedAt: null
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      queuePosition: true,
      queueEnteredAt: true,
      wasSkipped: true,
      status: {
        select: {
          id: true,
          name: true,
          color: true
        }
      }
    }
  })

  if (nextPosition > 1) {
    const previousTop = await prisma.user.findFirst({
      where: {
        tenantId,
        queuePosition: 1,
        active: true
      }
    })
    if (previousTop) {
      await prisma.user.update({
        where: { id: previousTop.id },
        data: { statusId: availableStatus.id }
      })
    }
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      performances: { select: { score: true }, orderBy: { periodStart: 'desc' }, take: 1 },
      status: { select: { id: true, name: true, color: true } }
    }
  })
  
  const queueUser: QueueUser = {
    id: u!.id,
    name: u!.name,
    email: u!.email,
    avatarUrl: u!.avatarUrl,
    queuePosition: u!.queuePosition,
    queueEnteredAt: u!.queueEnteredAt,
    wasSkipped: u!.wasSkipped,
    isIdle: u!.isIdle,
    score: u!.performances[0]?.score ? Number(u!.performances[0].score) : null,
    status: u!.status
  }

  const positions = await getPositionMap(tenantId)

  emitToTenant(tenantId, 'queue:user_joined', {
    user: queueUser,
    positions
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Queue',
      entityId: userId,
      newData: { action: 'join', position: nextPosition } as any
    }
  })

  return res.json(updatedUser)
}

export const leaveQueue = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { reason } = req.body as { reason?: 'manual' | 'completed' }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { queuePosition: true, queueEnteredAt: true }
  })

  if (!user || user.queuePosition === null) {
    throw new AppError('Você não está na fila.')
  }

  const offlineStatus = await getOfflineStatus(tenantId)
  const settings = await getQueueSettings(tenantId)

  await prisma.user.update({
    where: { id: userId },
    data: {
      queuePosition: null,
      queueEnteredAt: settings.strategy === 'FIFO' ? user.queueEnteredAt : null,
      queueOriginalPosition: null,
      wasSkipped: false,
      skippedAt: null,
      isIdle: false,
      statusId: offlineStatus.id
    }
  })

  await reorderQueueAfterLeave(tenantId)

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Queue',
      entityId: userId,
      newData: { action: 'leave', reason } as any
    }
  })

  const positions = await getPositionMap(tenantId)
  const newTopUser = await prisma.user.findFirst({
    where: { tenantId, queuePosition: 1, active: true },
    select: { id: true }
  })

  emitToTenant(tenantId, 'queue:user_left', {
    userId,
    reason: reason || 'manual',
    positions,
    newTopUserId: newTopUser?.id || null
  })
  emitToTenant(tenantId, 'user:status_changed', {
    userId,
    status: offlineStatus.name
  })

  return res.status(204).send()
}

export const openTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { customerId, title, description, estimatedValue } = req.body as {
    customerId?: string
    title?: string
    description?: string
    estimatedValue?: number
  }

  const settings = await getQueueSettings(tenantId)
  const lockReason = getLockReason(settings)

  if (lockReason.type !== null) {
    throw new AppError(lockReason.message || 'Fila não disponível no momento.')
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { queuePosition: true }
  })

  if (!user || user.queuePosition !== 1) {
    throw new AppError('Apenas o primeiro da fila pode abrir tickets.')
  }

  const lastTicket = await prisma.ticket.findFirst({
    where: { tenantId },
    orderBy: { number: 'desc' },
    select: { number: true }
  })

  const nextNumber = (lastTicket?.number ?? 0) + 1

  const busyStatus = await getBusyStatus(tenantId)

  const [ticket] = await prisma.$transaction([
    prisma.ticket.create({
      data: {
        tenantId,
        userId,
        customerId: customerId || null,
        number: nextNumber,
        title: title || `Atendimento #${nextNumber}`,
        description: description || null,
        estimatedValue: estimatedValue || null,
        status: 'IN_PROGRESS',
        acceptedAt: new Date()
      }
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        queuePosition: null,
        queueEnteredAt: null,
        statusId: busyStatus.id
      }
    })
  ])

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'CREATE',
      entity: 'Ticket',
      entityId: ticket.id,
      newData: { action: 'open_from_queue', ticketNumber: ticket.number } as any
    }
  })

  await reorderQueueAfterLeave(tenantId)

  const newTop = await prisma.user.findFirst({
    where: {
      tenantId,
      queuePosition: 1,
      active: true
    }
  })

  if (newTop) {
    const availableStatus = await getAvailableStatus(tenantId)
    await prisma.user.update({
      where: { id: newTop.id },
      data: { statusId: availableStatus.id }
    })
  }

  const positions = await getPositionMap(tenantId)

  emitToTenant(tenantId, 'queue:user_left', {
    userId,
    reason: 'open_ticket',
    positions,
    newTopUserId: newTop?.id || null
  })

  return res.json(ticket)
}

export const completeTicket = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const { ticketId, finalValue } = req.body as {
    ticketId: string
    finalValue?: number
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      userId,
      tenantId,
      status: 'IN_PROGRESS'
    }
  })

  if (!ticket) {
    throw new AppError('Ticket não encontrado ou não está em andamento.')
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      status: 'DONE',
      completedAt: new Date(),
      finalValue: finalValue || null
    }
  })

  await updateUserPerformance(userId, tenantId)

  const availableStatus = await getAvailableStatus(tenantId)
  const settings = await getQueueSettings(tenantId)

  const position = (await getLastQueuePosition(tenantId)) + 1

  await prisma.user.update({
    where: { id: userId },
    data: {
      queuePosition: position,
      queueEnteredAt: new Date(),
      statusId: availableStatus.id,
      wasSkipped: false,
      skippedAt: null
    }
  })

  const positions = await getPositionMap(tenantId)

  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      performances: { select: { score: true }, orderBy: { periodStart: 'desc' }, take: 1 },
      status: { select: { id: true, name: true, color: true } }
    }
  })
  
  const queueUser: QueueUser = {
    id: u!.id,
    name: u!.name,
    email: u!.email,
    avatarUrl: u!.avatarUrl,
    queuePosition: u!.queuePosition,
    queueEnteredAt: u!.queueEnteredAt,
    wasSkipped: u!.wasSkipped,
    isIdle: u!.isIdle,
    score: u!.performances[0]?.score ? Number(u!.performances[0].score) : null,
    status: u!.status
  }

  emitToTenant(tenantId, 'queue:user_joined', {
    user: queueUser,
    positions
  })

  return res.json({ message: 'Ticket concluído e vendedor retornou à fila.' })
}

export const skipUser = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const targetUserId = req.params.userId as string

  const requestingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (requestingUser?.role !== 'ADMIN' && requestingUser?.role !== 'MANAGER') {
    throw new AppError('Apenas gestores podem pular usuários.')
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      tenantId,
      queuePosition: { not: null },
      active: true
    }
  })

  if (!targetUser) {
    throw new AppError('Usuário não está na fila.', 404)
  }

  const lastPosition = await getLastQueuePosition(tenantId)

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      queuePosition: lastPosition + 1,
      wasSkipped: true,
      skippedAt: new Date()
    }
  })

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId,
      action: 'UPDATE',
      entity: 'Queue',
      entityId: targetUserId,
      newData: { action: 'skip', by: userId, newPosition: lastPosition + 1 } as any
    }
  })

  const positions = await getPositionMap(tenantId)

  emitToTenant(tenantId, 'queue:user_skipped', {
    userId: targetUserId,
    positions
  })

  return res.json({ message: 'Usuário movido para o final da fila.' })
}

export const getQueueSnapshots = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    throw new AppError('Apenas gestores podem ver snapshots.')
  }

  const limit = parseInt((req.query.limit as string) || '30')
  const snapshots = await getSnapshots(tenantId, limit)

  return res.json(snapshots)
}

export const getQueueSnapshotByDate = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!
  const date = req.params.date as string

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    throw new AppError('Apenas gestores podem ver snapshots.')
  }

  const snapshot = await getSnapshotByDate(tenantId, new Date(date))

  if (!snapshot) {
    throw new AppError('Nenhum snapshot encontrado para esta data.', 404)
  }

  return res.json(snapshot)
}

export const generateQueueSnapshot = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    throw new AppError('Apenas gestores podem gerar snapshots.')
  }

  const snapshot = await generateSnapshot(tenantId, 'MANUAL')

  return res.json(snapshot)
}

export const getQueueSnapshotsWithActions = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const { date, page, pageSize, startDate, endDate } = req.query

  if (startDate && endDate) {
    const snapshots = await getSnapshotsInRange(
      tenantId,
      new Date(startDate as string),
      new Date(endDate as string),
      parseInt((req.query.limit as string) || '30')
    )
    return res.json(snapshots)
  }

  if (!date) {
    throw new AppError('Data é obrigatória.')
  }

  const result = await getSnapshotWithActions(
    tenantId,
    new Date(date as string),
    parseInt((page as string) || '1'),
    parseInt((pageSize as string) || '50')
  )

  return res.json(result)
}

export const getQueueConfig = async (req: Request, res: Response) => {
  const { tenantId } = req.user!
  const settings = await getQueueSettings(tenantId)
  
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const currentTime = formatter.format(now)
  const currentMinutes = (parseInt(currentTime.split(':')[0]) * 60) + parseInt(currentTime.split(':')[1])
  const startMinutes = (parseInt(settings.businessHoursStart.split(':')[0]) * 60) + parseInt(settings.businessHoursStart.split(':')[1])
  const endMinutes = (parseInt(settings.businessHoursEnd.split(':')[0]) * 60) + parseInt(settings.businessHoursEnd.split(':')[1])
  const isWithinHours = !settings.businessHoursEnabled || (currentMinutes >= startMinutes && currentMinutes <= endMinutes)

  return res.json({
    ...settings,
    isWithinHours,
    currentTime
  })
}

export const updateQueueConfig = async (req: Request, res: Response) => {
  const { tenantId, userId } = req.user!

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
    throw new AppError('Apenas gestores podem alterar as configurações.')
  }

  const updates = req.body as Partial<QueueSettings>
  const settings = await updateQueueSettings(tenantId, updates)

  emitToTenant(tenantId, 'queue:settings_changed', settings)

  if (updates.locked !== undefined) {
    if (updates.locked === true) {
      await generateSnapshot(tenantId, 'MANUAL')
    }
  }

  return res.json(settings)
}

async function reorderQueueAfterLeave(tenantId: string): Promise<void> {
  const settings = await getQueueSettings(tenantId)

  let orderBy: any = { queueEnteredAt: 'asc' }

  if (settings.strategy === 'PERFORMANCE') {
    orderBy = { performances: { score: 'desc' } }
  } else if (settings.strategy === 'HYBRID') {
    orderBy = [
      { performances: { score: 'desc' } },
      { queueEnteredAt: 'asc' }
    ]
  }

  const usersInQueue = await prisma.user.findMany({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true
    },
    orderBy,
    include: {
      performances: {
        select: { score: true }
      }
    }
  })

  await prisma.$transaction(
    usersInQueue.map((user, index) =>
      prisma.user.update({
        where: { id: user.id },
        data: { queuePosition: index + 1 }
      })
    )
  )

  if (usersInQueue.length > 0) {
    const availableStatus = await getAvailableStatus(tenantId)
    await prisma.user.update({
      where: { id: usersInQueue[0].id },
      data: { statusId: availableStatus.id }
    })
  }
}

