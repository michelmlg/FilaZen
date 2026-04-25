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
  return prisma.queueEntry.count({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true }
    }
  })
}

export async function getLastQueuePosition(tenantId: string): Promise<number> {
  const last = await prisma.queueEntry.findFirst({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true },
      isIdle: false
    },
    orderBy: { position: 'desc' },
    select: { position: true }
  })
  
  return last?.position ?? 0
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

export async function isUserInQueue(tenantUserId: string): Promise<boolean> {
  const entry = await prisma.queueEntry.findUnique({
    where: { tenantUserId },
    select: { position: true }
  })
  
  return entry?.position !== null
}

export async function getUserQueuePosition(tenantUserId: string): Promise<number | null> {
  const entry = await prisma.queueEntry.findUnique({
    where: { tenantUserId },
    select: { position: true }
  })
  
  return entry?.position ?? null
}

export async function reorderQueue(tenantId: string, strategy: QueueStrategy): Promise<void> {
  let orderBy: any = { enteredAt: 'asc' }

  if (strategy === 'PERFORMANCE') {
    orderBy = { tenantUser: { user: { performances: { score: 'desc' } } } }
  } else if (strategy === 'HYBRID') {
    orderBy = [
      { tenantUser: { user: { performances: { score: 'desc' } } } },
      { enteredAt: 'asc' }
    ]
  }

  const entriesInQueue = await prisma.queueEntry.findMany({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true }
    },
    orderBy,
    include: {
      tenantUser: {
        include: {
          user: {
            select: { performances: { select: { score: true } } }
          }
        }
      }
    }
  })

  await prisma.$transaction(
    entriesInQueue.map((entry, index) =>
      prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: index + 1 }
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
  console.log('[DEBUG buildQueueSnapshot] tenantId:', tenantId)
  const entries = await prisma.queueEntry.findMany({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true }
    },
    include: {
      tenantUser: {
        include: {
          user: { omit: { passwordHash: true } },
          status: true
        }
      }
    },
    orderBy: { position: 'asc' }
  })
  
  return entries.map(e => ({
    id: e.tenantUser.user.id,
    name: e.tenantUser.user.name,
    email: e.tenantUser.user.email,
    avatarUrl: e.tenantUser.user.avatarUrl,
    queuePosition: e.position,
    queueEnteredAt: e.enteredAt,
    wasSkipped: e.wasSkipped,
    isIdle: e.isIdle,
    score: e.tenantUser.user.performances?.[0]?.score ? Number(e.tenantUser.user.performances[0].score) : null,
    status: e.tenantUser.status
  }))
}

/**
 * Returns a lightweight position map for all users in the queue.
 * Used in WS events to update positions without sending full user data.
 */
export async function getPositionMap(tenantId: string): Promise<{ id: string; position: number }[]> {
  const entries = await prisma.queueEntry.findMany({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true }
    },
    include: {
      tenantUser: {
        include: { user: true }
      }
    },
    orderBy: { position: 'asc' }
  })
  
  return entries.map(e => ({ id: e.tenantUser.user.id, position: e.position! }))
}

export async function checkIdleUsers(tenantId: string): Promise<void> {
  const settings = await getQueueSettings(tenantId)
  const connectedUsers = getConnectedUsers()
  
  const entriesInQueue = await prisma.queueEntry.findMany({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true }
    },
    include: {
      tenantUser: {
        include: { user: true }
      }
    }
  })

  const timeoutMs = settings.idleTimeoutUnit === 'hours' 
    ? settings.idleTimeout * 60 * 60 * 1000 
    : settings.idleTimeout * 60 * 1000

  const now = new Date()

  for (const entry of entriesInQueue) {
    const userId = entry.tenantUser.user.id
    // Verificar primeiro no Map (memória), depois no DB (lastPing)
    const lastConnected = connectedUsers.get(userId)
    const lastPing = entry.lastPing?.getTime()
    // Usa o mais recente entre Map e DB
    const lastActive = lastConnected || lastPing
    const isConnected = lastActive && (now.getTime() - lastActive) < timeoutMs
    
    if (!isConnected && entry.position !== null) {
      if (settings.idleBehavior === 'remove') {
        await prisma.queueEntry.update({
          where: { id: entry.id },
          data: {
            position: null,
            enteredAt: null,
            originalPosition: null,
            isIdle: false
          }
        })
        emitToTenant(tenantId, 'queue:user_removed', { userId })
      } else if (settings.idleBehavior === 'maintain_position' && !entry.isIdle) {
        await prisma.queueEntry.update({
          where: { id: entry.id },
          data: {
            isIdle: true,
            originalPosition: entry.position
          }
        })
        emitToTenant(tenantId, 'queue:user_away', { userId })
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
    const entriesInQueue = await prisma.queueEntry.findMany({
      where: {
        AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
        position: { not: null },
        tenantUser: { active: true }
      },
      orderBy: [
        { isIdle: 'asc' },
        { enteredAt: 'asc' }
      ],
      select: {
        id: true,
        isIdle: true
      }
    })

    const activeEntries = entriesInQueue.filter((e) => !e.isIdle)
    const idleEntries = entriesInQueue.filter((e) => e.isIdle)

    let position = 1
    for (const entry of activeEntries) {
      await prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: position++ }
      })
    }

    const startIdlePosition = position
    for (let i = 0; i < idleEntries.length; i++) {
      await prisma.queueEntry.update({
        where: { id: idleEntries[i].id },
        data: { position: startIdlePosition + i }
      })
    }
  })
}

export async function reconnectUser(tenantUserId: string): Promise<{ success: boolean; tenantId?: string }> {
  const entry = await prisma.queueEntry.findUnique({
    where: { tenantUserId },
    include: { tenantUser: { select: { tenantId: true, active: true } } }
  })

  if (!entry || entry.position === null || !entry.tenantUser?.active) {
    return { success: false }
  }

  const tenantId = entry.tenantUser.tenantId

  if (entry.isIdle && entry.originalPosition !== null) {
    await prisma.queueEntry.update({
      where: { tenantUserId },
      data: {
        isIdle: false,
        position: entry.originalPosition,
        originalPosition: null
      }
    })

    await reorderQueueByActiveUsers(tenantId)
    
    const positions = await getPositionMap(tenantId)
    emitToTenant(tenantId, 'queue:user_reconnected', {
      userId: entry.tenantUser.user.id,
      position: entry.originalPosition,
      positions
    })
  }

  return { success: true, tenantId }
}

async function reorderQueueByActiveUsers(tenantId: string): Promise<void> {
  const entriesInQueue = await prisma.queueEntry.findMany({
    where: {
      AND: [
      { tenantUser: { tenant: { id: tenantId } } },
      { tenantUser: { tenantId: tenantId } }
    ],
      position: { not: null },
      tenantUser: { active: true },
      isIdle: false
    },
    orderBy: { enteredAt: 'asc' },
    select: { id: true }
  })

  await prisma.$transaction(
    entriesInQueue.map((entry, index) =>
      prisma.queueEntry.update({
        where: { id: entry.id },
        data: { position: index + 1 }
      })
    )
  )
}


