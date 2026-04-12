import { prisma } from '../utils/prisma'
import { QueueStrategy, StatusMeaning } from '@prisma/client'
import { emitToTenant, getConnectedUsers } from './socket.service'

export interface QueueSettings {
  strategy: QueueStrategy
  businessHoursEnabled: boolean
  businessHoursStart: string
  businessHoursEnd: string
  timezone: string
  maxQueueSize: number
  autoSnapshot: boolean
  clearOnStart: boolean
  locked: boolean
  showAllInQueue: boolean
  usePrimaryColorForCrown: boolean
  idleBehavior: 'maintain_position' | 'remove'
  idleTimeout: number
  idleTimeoutUnit: 'minutes' | 'hours'
}

const DEFAULT_SETTINGS: QueueSettings = {
  strategy: QueueStrategy.FIFO,
  businessHoursEnabled: false,
  businessHoursStart: '08:00',
  businessHoursEnd: '18:00',
  timezone: 'America/Sao_Paulo',
  maxQueueSize: 50,
  autoSnapshot: true,
  clearOnStart: false,
  locked: false,
  showAllInQueue: false,
  usePrimaryColorForCrown: false,
  idleBehavior: 'maintain_position',
  idleTimeout: 5,
  idleTimeoutUnit: 'minutes',
}

/**
 * Safely parses a JSON value to boolean.
 * Handles: true, false, "true", "false", 1, 0
 */
function parseBool(value: unknown, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.toLowerCase() === 'true'
  if (typeof value === 'number') return value !== 0
  return fallback
}

export async function getQueueSettings(tenantId: string): Promise<QueueSettings> {
  const settings = await prisma.tenantSetting.findMany({
    where: { tenantId }
  })

  const settingsMap = new Map(settings.map(s => [s.key, s.value]))

  return {
    strategy: (settingsMap.get('queue_strategy') as QueueStrategy) || DEFAULT_SETTINGS.strategy,
    businessHoursEnabled: parseBool(settingsMap.get('queue_business_hours_enabled'), DEFAULT_SETTINGS.businessHoursEnabled),
    businessHoursStart: (settingsMap.get('queue_business_hours_start') as string) || DEFAULT_SETTINGS.businessHoursStart,
    businessHoursEnd: (settingsMap.get('queue_business_hours_end') as string) || DEFAULT_SETTINGS.businessHoursEnd,
    timezone: (settingsMap.get('queue_timezone') as string) || DEFAULT_SETTINGS.timezone,
    maxQueueSize: (settingsMap.get('queue_max_size') as number) || DEFAULT_SETTINGS.maxQueueSize,
    autoSnapshot: parseBool(settingsMap.get('queue_auto_snapshot'), DEFAULT_SETTINGS.autoSnapshot),
    clearOnStart: parseBool(settingsMap.get('queue_clear_on_start'), DEFAULT_SETTINGS.clearOnStart),
    locked: parseBool(settingsMap.get('queue_locked'), DEFAULT_SETTINGS.locked),
    showAllInQueue: parseBool(settingsMap.get('queue_show_all_in_queue'), DEFAULT_SETTINGS.showAllInQueue),
    usePrimaryColorForCrown: parseBool(settingsMap.get('queue_use_primary_color_for_crown'), DEFAULT_SETTINGS.usePrimaryColorForCrown),
    idleBehavior: (settingsMap.get('queue_idle_behavior') as 'maintain_position' | 'remove') || DEFAULT_SETTINGS.idleBehavior,
    idleTimeout: (settingsMap.get('queue_idle_timeout') as number) || DEFAULT_SETTINGS.idleTimeout,
    idleTimeoutUnit: (settingsMap.get('queue_idle_timeout_unit') as 'minutes' | 'hours') || DEFAULT_SETTINGS.idleTimeoutUnit,
  }
}

export async function updateQueueSettings(
  tenantId: string, 
  updates: Partial<QueueSettings>
): Promise<QueueSettings> {
  const keyMap: Record<string, string> = {
    strategy: 'queue_strategy',
    businessHoursEnabled: 'queue_business_hours_enabled',
    businessHoursStart: 'queue_business_hours_start',
    businessHoursEnd: 'queue_business_hours_end',
    timezone: 'queue_timezone',
    maxQueueSize: 'queue_max_size',
    autoSnapshot: 'queue_auto_snapshot',
    clearOnStart: 'queue_clear_on_start',
    locked: 'queue_locked',
    showAllInQueue: 'queue_show_all_in_queue',
    usePrimaryColorForCrown: 'queue_use_primary_color_for_crown',
    idleBehavior: 'queue_idle_behavior',
    idleTimeout: 'queue_idle_timeout',
    idleTimeoutUnit: 'queue_idle_timeout_unit',
  }

  for (const [key, dbKey] of Object.entries(keyMap)) {
    if (updates[key as keyof QueueSettings] !== undefined) {
      await prisma.tenantSetting.upsert({
        where: {
          tenantId_key: {
            tenantId,
            key: dbKey
          }
        },
        create: {
          tenantId,
          key: dbKey,
          value: updates[key as keyof QueueSettings] as any
        },
        update: {
          value: updates[key as keyof QueueSettings] as any
        }
      })
    }
  }

  return getQueueSettings(tenantId)
}

export function isWithinBusinessHours(settings: QueueSettings): boolean {
  if (!settings.businessHoursEnabled) return true
  
  const now = new Date()
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: settings.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const currentTime = formatter.format(now)
  const currentMinutes = timeToMinutes(currentTime)
  const startMinutes = timeToMinutes(settings.businessHoursStart)
  const endMinutes = timeToMinutes(settings.businessHoursEnd)
  
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export async function getQueueSize(tenantId: string): Promise<number> {
  return prisma.user.count({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true
    }
  })
}

export async function getLastQueuePosition(tenantId: string): Promise<number> {
  const last = await prisma.user.findFirst({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true,
      isIdle: false
    },
    orderBy: { queuePosition: 'desc' },
    select: { queuePosition: true }
  })
  
  return last?.queuePosition ?? 0
}

export async function getAvailableStatus(tenantId: string) {
  let status = await prisma.userStatus.findFirst({
    where: {
      tenantId,
      meaning: StatusMeaning.AVAILABLE,
      active: true
    }
  })
  
  if (!status) {
    status = await prisma.userStatus.create({
      data: {
        tenantId,
        name: 'Disponível',
        color: '#22c55e',
        meaning: StatusMeaning.AVAILABLE,
        isDefault: true,
        active: true
      }
    })
  }
  
  return status
}

export async function getBusyStatus(tenantId: string) {
  let status = await prisma.userStatus.findFirst({
    where: {
      tenantId,
      meaning: StatusMeaning.BUSY,
      active: true
    }
  })
  
  if (!status) {
    status = await prisma.userStatus.create({
      data: {
        tenantId,
        name: 'Em Atendimento',
        color: '#ef4444',
        meaning: StatusMeaning.BUSY,
        active: true
      }
    })
  }
  
  return status
}

export async function getAwaitingStatus(tenantId: string) {
  let status = await prisma.userStatus.findFirst({
    where: {
      tenantId,
      meaning: StatusMeaning.AWAY,
      active: true
    }
  })
  
  if (!status) {
    status = await prisma.userStatus.create({
      data: {
        tenantId,
        name: 'Aguardando',
        color: '#f59e0b',
        meaning: StatusMeaning.AWAY,
        active: true
      }
    })
  }
  
  return status
}

export async function getOfflineStatus(tenantId: string) {
  let status = await prisma.userStatus.findFirst({
    where: {
      tenantId,
      meaning: StatusMeaning.OFFLINE,
      active: true
    }
  })
  
  if (!status) {
    status = await prisma.userStatus.create({
      data: {
        tenantId,
        name: 'Offline',
        color: '#6b7280',
        meaning: StatusMeaning.OFFLINE,
        active: true
      }
    })
  }
  
  return status
}

export async function isUserInQueue(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { queuePosition: true }
  })
  
  return user?.queuePosition !== null
}

export async function getUserQueuePosition(userId: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { queuePosition: true }
  })
  
  return user?.queuePosition ?? null
}

export async function reorderQueue(tenantId: string, strategy: QueueStrategy): Promise<void> {
  let orderBy: any = { queueEnteredAt: 'asc' }

  if (strategy === 'PERFORMANCE') {
    orderBy = { performances: { score: 'desc' } }
  } else if (strategy === 'HYBRID') {
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
}

export interface QueueUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  queuePosition: number | null
  queueEnteredAt: Date | null
  wasSkipped: boolean
  isIdle: boolean
  score: number | null
  status: {
    id: string
    name: string
    color: string
  } | null
}

export async function buildQueueSnapshot(tenantId: string): Promise<QueueUser[]> {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      queuePosition: true,
      queueEnteredAt: true,
      wasSkipped: true,
      isIdle: true,
      performances: {
        select: { score: true },
        orderBy: { periodStart: 'desc' },
        take: 1
      },
      status: {
        select: {
          id: true,
          name: true,
          color: true
        }
      }
    },
    orderBy: { queuePosition: 'asc' }
  })
  
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl,
    queuePosition: u.queuePosition,
    queueEnteredAt: u.queueEnteredAt,
    wasSkipped: u.wasSkipped,
    isIdle: u.isIdle,
    score: u.performances[0]?.score ? Number(u.performances[0].score) : null,
    status: u.status
  }))
}

/**
 * Returns a lightweight position map for all users in the queue.
 * Used in WS events to update positions without sending full user data.
 */
export async function getPositionMap(tenantId: string): Promise<{ id: string; position: number }[]> {
  const users = await prisma.user.findMany({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true
    },
    select: {
      id: true,
      queuePosition: true
    },
    orderBy: { queuePosition: 'asc' }
  })
  
  return users.map(u => ({ id: u.id, position: u.queuePosition! }))
}

export async function checkIdleUsers(tenantId: string): Promise<void> {
  const settings = await getQueueSettings(tenantId)
  const connectedUsers = getConnectedUsers()
  
  const usersInQueue = await prisma.user.findMany({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true
    },
    select: {
      id: true,
      queuePosition: true,
      queueOriginalPosition: true,
      isIdle: true,
      lastQueuePing: true
    }
  })

  const timeoutMs = settings.idleTimeoutUnit === 'hours' 
    ? settings.idleTimeout * 60 * 60 * 1000 
    : settings.idleTimeout * 60 * 1000

  const now = new Date()

  for (const user of usersInQueue) {
    // Verificar primeiro no Map (memória), depois no DB (lastQueuePing)
    const lastConnected = connectedUsers.get(user.id)
    const lastPing = user.lastQueuePing?.getTime()
    // Usa o mais recente entre Map e DB
    const lastActive = lastConnected || lastPing
    const isConnected = lastActive && (now.getTime() - lastActive) < timeoutMs
    
    if (!isConnected && user.queuePosition !== null) {
      if (settings.idleBehavior === 'remove') {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            queuePosition: null,
            queueEnteredAt: null,
            queueOriginalPosition: null,
            isIdle: false
          }
        })
        emitToTenant(tenantId, 'queue:user_removed', { userId: user.id })
      } else if (settings.idleBehavior === 'maintain_position' && !user.isIdle) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isIdle: true,
            queueOriginalPosition: user.queuePosition
          }
        })
        emitToTenant(tenantId, 'queue:user_away', { userId: user.id })
      }
    }
  }

  await reorderQueueBasedOnIdle(tenantId)

  // Emitir posições atualizadas após reordenação
  const positions = await getPositionMap(tenantId)
  emitToTenant(tenantId, 'queue:positions_updated', { positions })
}

function reorderQueueBasedOnIdle(tenantId: string): Promise<void> {
  return prisma.$transaction(async () => {
    const usersInQueue = await prisma.user.findMany({
      where: {
        tenantId,
        queuePosition: { not: null },
        active: true
      },
      orderBy: [
        { isIdle: 'asc' },
        { queueEnteredAt: 'asc' }
      ],
      select: {
        id: true,
        isIdle: true
      }
    })

    const activeUsers = usersInQueue.filter((u) => !u.isIdle)
    const idleUsers = usersInQueue.filter((u) => u.isIdle)

    let position = 1
    for (const user of activeUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { queuePosition: position++ }
      })
    }

    const startIdlePosition = position
    for (let i = 0; i < idleUsers.length; i++) {
      await prisma.user.update({
        where: { id: idleUsers[i].id },
        data: { queuePosition: startIdlePosition + i }
      })
    }
  })
}

export async function reconnectUser(userId: string): Promise<{ success: boolean; tenantId?: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, queuePosition: true, queueOriginalPosition: true, isIdle: true }
  })

  if (!user || user.queuePosition === null) {
    return { success: false }
  }

  const tenantId = user.tenantId

  if (user.isIdle && user.queueOriginalPosition !== null) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isIdle: false,
        queuePosition: user.queueOriginalPosition,
        queueOriginalPosition: null
      }
    })

    await reorderQueueByActiveUsers(tenantId)
    
    const positions = await getPositionMap(tenantId)
    emitToTenant(tenantId, 'queue:user_reconnected', {
      userId,
      position: user.queueOriginalPosition,
      positions
    })
  }

  return { success: true, tenantId }
}

async function reorderQueueByActiveUsers(tenantId: string): Promise<void> {
  const usersInQueue = await prisma.user.findMany({
    where: {
      tenantId,
      queuePosition: { not: null },
      active: true,
      isIdle: false
    },
    orderBy: { queueEnteredAt: 'asc' },
    select: { id: true }
  })

  await prisma.$transaction(
    usersInQueue.map((user, index) =>
      prisma.user.update({
        where: { id: user.id },
        data: { queuePosition: index + 1 }
      })
    )
  )
}


