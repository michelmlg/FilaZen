import { prisma } from '../utils/prisma'
import { QueueStrategy } from '@prisma/client'
import { getQueueSettings, buildQueueSnapshot, QueueUser } from './queue.service'

export interface SnapshotData {
  userId: string
  name: string
  position: number
  totalTicketsToday: number
  status: string
  queueEnteredAt: string
}

export interface SnapshotMetadata {
  totalInQueue: number
  avgWaitTimeMinutes: number
  generatedBy: 'SCHEDULE' | 'MANUAL'
}

export interface QueueSnapshotResult {
  id: string
  tenantId: string
  snapshotDate: Date
  strategy: QueueStrategy
  queueData: SnapshotData[]
  metadata: SnapshotMetadata
  createdAt: Date
}

export interface QueueAction {
  id: string
  timestamp: Date
  userId: string
  userName: string
  actionType: 'JOIN' | 'LEAVE' | 'SKIP' | 'OPEN_TICKET' | 'COMPLETE_TICKET' | 'LOCK' | 'UNLOCK'
  position: number | null
  details?: Record<string, any>
}

export interface SnapshotWithActions {
  snapshot: QueueSnapshotResult | null
  actions: {
    items: QueueAction[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

async function getTicketsCountToday(userId: string, tenantId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  return prisma.ticket.count({
    where: {
      tenantId,
      userId,
      createdAt: { gte: today }
    }
  })
}

async function calculateAvgWaitTime(queue: QueueUser[]): Promise<number> {
  if (queue.length === 0) return 0
  
  const now = new Date()
  let totalMinutes = 0
  
  for (const user of queue) {
    if (user.queueEnteredAt) {
      const diff = now.getTime() - new Date(user.queueEnteredAt).getTime()
      totalMinutes += diff / (1000 * 60)
    }
  }
  
  return Math.round(totalMinutes / queue.length)
}

export async function generateSnapshot(
  tenantId: string,
  generatedBy: 'SCHEDULE' | 'MANUAL' = 'MANUAL'
): Promise<QueueSnapshotResult> {
  const settings = await getQueueSettings(tenantId)
  const queueUsers = await buildQueueSnapshot(tenantId)
  
  const queueDataPromises = queueUsers.map(async (user, index) => {
    const ticketsToday = await getTicketsCountToday(user.id, tenantId)
    return {
      userId: user.id,
      name: user.name,
      position: index + 1,
      totalTicketsToday: ticketsToday,
      status: user.status?.name || 'Desconhecido',
      queueEnteredAt: user.queueEnteredAt?.toISOString() || ''
    }
  })
  
  const queueData = await Promise.all(queueDataPromises)
  const avgWaitTime = await calculateAvgWaitTime(queueUsers)
  
  const snapshot = await prisma.queueSnapshot.create({
    data: {
      tenantId,
      snapshotDate: new Date(),
      strategy: settings.strategy,
      queueData: {
        queueData,
        metadata: {
          totalInQueue: queueData.length,
          avgWaitTimeMinutes: avgWaitTime,
          generatedBy
        }
      } as any
    }
  })
  
  return {
    id: snapshot.id,
    tenantId: snapshot.tenantId,
    snapshotDate: snapshot.snapshotDate,
    strategy: snapshot.strategy,
    queueData,
    metadata: {
      totalInQueue: queueData.length,
      avgWaitTimeMinutes: avgWaitTime,
      generatedBy
    },
    createdAt: snapshot.createdAt
  }
}

export async function getSnapshots(
  tenantId: string,
  limit: number = 30
): Promise<QueueSnapshotResult[]> {
  const snapshots = await prisma.queueSnapshot.findMany({
    where: { tenantId },
    orderBy: { snapshotDate: 'desc' },
    take: limit
  })
  
  return snapshots.map(s => {
    const data = s.queueData as any
    return {
      id: s.id,
      tenantId: s.tenantId,
      snapshotDate: s.snapshotDate,
      strategy: s.strategy,
      queueData: data.queueData || [],
      metadata: data.metadata || { totalInQueue: 0, avgWaitTimeMinutes: 0, generatedBy: 'MANUAL' },
      createdAt: s.createdAt
    }
  })
}

export async function getSnapshotByDate(
  tenantId: string,
  date: Date
): Promise<QueueSnapshotResult | null> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  
  const snapshot = await prisma.queueSnapshot.findFirst({
    where: {
      tenantId,
      snapshotDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: { snapshotDate: 'desc' }
  })
  
  if (!snapshot) return null
  
  const data = snapshot.queueData as any
  return {
    id: snapshot.id,
    tenantId: snapshot.tenantId,
    snapshotDate: snapshot.snapshotDate,
    strategy: snapshot.strategy,
    queueData: data.queueData || [],
    metadata: data.metadata || { totalInQueue: 0, avgWaitTimeMinutes: 0, generatedBy: 'MANUAL' },
    createdAt: snapshot.createdAt
  }
}

export async function getSnapshotWithActions(
  tenantId: string,
  date: Date,
  page: number = 1,
  pageSize: number = 50
): Promise<SnapshotWithActions> {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)
  
  const snapshot = await prisma.queueSnapshot.findFirst({
    where: {
      tenantId,
      snapshotDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    orderBy: { snapshotDate: 'desc' }
  })
  
  let snapshotResult: QueueSnapshotResult | null = null
  if (snapshot) {
    const data = snapshot.queueData as any
    snapshotResult = {
      id: snapshot.id,
      tenantId: snapshot.tenantId,
      snapshotDate: snapshot.snapshotDate,
      strategy: snapshot.strategy,
      queueData: data.queueData || [],
      metadata: data.metadata || { totalInQueue: 0, avgWaitTimeMinutes: 0, generatedBy: 'MANUAL' },
      createdAt: snapshot.createdAt
    }
  }
  
  const skip = (page - 1) * pageSize
  
  const whereClause: any = {
    tenantId,
    entity: { in: ['Queue', 'Ticket'] },
    createdAt: {
      gte: startOfDay,
      lte: endOfDay
    }
  }
  
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      skip,
      take: pageSize
    })
  ])
  
  const usersCache = new Map<string, string>()
  
  const actions: QueueAction[] = logs
    .map(log => {
      const userId = log.userId || 'unknown'
      let userName = usersCache.get(userId)
      if (!userName) {
        userName = `User ${userId.slice(0, 8)}`
      }
      
      let actionType: QueueAction['actionType'] = 'JOIN'
      let position: number | null = null
      
      if (log.entity === 'Ticket' && log.newData) {
        const newData = log.newData as any
        if (newData.action === 'open_from_queue') {
          actionType = 'OPEN_TICKET'
        }
      } else if (log.entity === 'Queue') {
        const newData = log.newData as any
        if (newData?.action === 'join') {
          actionType = 'JOIN'
          position = newData.position
        } else if (newData?.action === 'leave') {
          actionType = 'LEAVE'
        } else if (newData?.action === 'skip') {
          actionType = 'SKIP'
          position = newData.newPosition
        } else if (newData?.action === 'lock') {
          actionType = 'LOCK'
        } else if (newData?.action === 'unlock') {
          actionType = 'UNLOCK'
        }
      }
      
      return {
        id: log.id,
        timestamp: log.createdAt,
        userId,
        userName,
        actionType,
        position,
        details: log.newData as Record<string, any> | undefined
      }
    })
  
  return {
    snapshot: snapshotResult,
    actions: {
      items: actions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }
}

export async function getSnapshotsInRange(
  tenantId: string,
  startDate: Date,
  endDate: Date,
  limit: number = 30
): Promise<QueueSnapshotResult[]> {
  const snapshots = await prisma.queueSnapshot.findMany({
    where: {
      tenantId,
      snapshotDate: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { snapshotDate: 'desc' },
    take: limit
  })
  
  return snapshots.map(s => {
    const data = s.queueData as any
    return {
      id: s.id,
      tenantId: s.tenantId,
      snapshotDate: s.snapshotDate,
      strategy: s.strategy,
      queueData: data.queueData || [],
      metadata: data.metadata || { totalInQueue: 0, avgWaitTimeMinutes: 0, generatedBy: 'MANUAL' },
      createdAt: s.createdAt
    }
  })
}
