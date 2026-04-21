import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from './auth.store'

export interface QueueStatus {
  id: string
  name: string
  color: string
  meaning?: string
}

export interface UserInQueue {
  id: string
  name: string
  email?: string
  avatarUrl?: string | null
  queuePosition: number | null
  queueEnteredAt: string | null
  wasSkipped: boolean
  status: QueueStatus | null
  isIdle?: boolean
  queueOriginalPosition?: number | null
  score?: number | null
}

export interface QueueSettings {
  strategy: 'FIFO' | 'PERFORMANCE' | 'HYBRID'
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
  isWithinHours: boolean
  currentTime?: string
}

export interface LockReason {
  type: 'MANUAL' | 'BUSINESS_HOURS' | null
  message: string | null
}

export interface QueuePayload {
  users: UserInQueue[]
  total: number
  topUserId: string | null
  isLocked: boolean
  reason: LockReason
}

export interface UserQueueStatus {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  queuePosition: number | null
  queueEnteredAt: string | null
  wasSkipped: boolean
  isInQueue: boolean
  isTopOfQueue: boolean
  canOpenTicket: boolean
  isLocked: boolean
  lockReason: LockReason
  status: QueueStatus | null
}

export interface SnapshotUserData {
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

export interface SnapshotData {
  id: string
  tenantId: string
  snapshotDate: string
  strategy: 'FIFO' | 'PERFORMANCE' | 'HYBRID'
  queueData: SnapshotUserData[]
  metadata: SnapshotMetadata
  createdAt: string
}

export interface QueueAction {
  id: string
  timestamp: string
  userId: string
  userName: string
  actionType: 'JOIN' | 'LEAVE' | 'SKIP' | 'OPEN_TICKET' | 'COMPLETE_TICKET' | 'LOCK' | 'UNLOCK'
  position: number | null
  details?: Record<string, any>
}

export interface SnapshotWithActions {
  snapshot: SnapshotData | null
  actions: {
    items: QueueAction[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export const useQueueStore = defineStore('queue', () => {
  const { get, post, put } = useApi()
  const ws = useWebSocket()
  const auth = useAuthStore()

  const queue = ref<UserInQueue[]>([])
  const previousQueue = ref<UserInQueue[]>([])
  const settings = ref<QueueSettings | null>(null)
  const currentUserStatus = ref<UserQueueStatus | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  const reconnecting = ref(false)

  const snapshots = ref<SnapshotData[]>([])
  const currentSnapshotDetail = ref<SnapshotWithActions | null>(null)
  const loadingSnapshots = ref(false)
  const snapshotsError = ref<string | null>(null)

  const sortedQueue = computed(() => 
    [...queue.value].sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))
  )

  const currentUserInQueue = computed(() =>
    queue.value.find(u => u.id === auth.user?.id)
  )

  const isUserInQueue = computed(() => !!currentUserInQueue.value)

  const currentUserPosition = computed(() =>
    currentUserInQueue.value?.queuePosition ?? null
  )

  const isUserTopOfQueue = computed(() =>
    currentUserPosition.value === 1
  )

  const canUserOpenTicket = computed(() =>
    isUserTopOfQueue.value && !isQueueLocked.value
  )

  const isQueueLocked = computed(() => {
    if (!settings.value) return false
    if (settings.value.locked) return true
    if (settings.value.businessHoursEnabled && !settings.value.isWithinHours) return true
    return false
  })

  const lockReason = computed((): LockReason => {
    if (!settings.value) return { type: null, message: null }
    if (settings.value.locked) return { type: 'MANUAL', message: 'Fila travada pelo administrador' }
    if (settings.value.businessHoursEnabled && !settings.value.isWithinHours) return { type: 'BUSINESS_HOURS', message: 'Fora do horário comercial' }
    return { type: null, message: null }
  })

  const topOfQueue = computed(() => sortedQueue.value[0] || null)

  const nextUserAfterCurrent = computed(() => {
    if (!currentUserInQueue.value) return null
    const currentPos = currentUserInQueue.value.queuePosition || 0
    return sortedQueue.value.find(u => (u.queuePosition || 0) === currentPos + 1) || null
  })

  const activeUsers = computed(() =>
    queue.value.filter(u => !u.isIdle)
  )

  const idleUsers = computed(() =>
    queue.value.filter(u => u.isIdle === true)
  )

  const fetchQueue = async () => {
    loading.value = true
    error.value = null
    try {
      const payload = await get<QueuePayload>('/queue')
      previousQueue.value = [...queue.value]
      queue.value = payload.users
    } catch (e: any) {
      error.value = e.message || 'Falha ao obter fila'
      console.error('Falha ao obter fila', e)
    } finally {
      loading.value = false
    }
  }

  const fetchMyStatus = async () => {
    try {
      currentUserStatus.value = await get<UserQueueStatus>('/queue/me')
    } catch (e: any) {
      console.error('Falha ao obter status do usuário', e)
    }
  }

  const fetchSettings = async () => {
    try {
      settings.value = await get<QueueSettings>('/queue/settings')
    } catch (e: any) {
      console.error('Falha ao obter configurações da fila', e)
    }
  }

  const joinQueue = async () => {
    loading.value = true
    error.value = null
    try {
      await post('/queue/join')
      await fetchQueue()
      await fetchMyStatus()
      return true
    } catch (e: any) {
      error.value = e.message || 'Falha ao entrar na fila'
      return false
    } finally {
      loading.value = false
    }
  }

  const leaveQueue = async () => {
    loading.value = true
    error.value = null
    try {
      await post('/queue/leave')
      await fetchQueue()
      await fetchMyStatus()
      return true
    } catch (e: any) {
      error.value = e.message || 'Falha ao sair da fila'
      return false
    } finally {
      loading.value = false
    }
  }

  const reconnectUser = async () => {
    try {
      await post('/queue/reconnect')
      return true
    } catch (e: any) {
      console.error('Falha ao reconectar usuário na fila', e)
      return false
    }
  }

  const cleanup = () => {
    ws.emitOffline()
    initialized.value = false
  }

  const openTicket = async (ticketData?: {
    customerId?: string
    title?: string
    description?: string
    estimatedValue?: number
  }) => {
    loading.value = true
    error.value = null
    try {
      const ticket = await post<any>('/queue/open-ticket', ticketData)
      await fetchQueue()
      await fetchMyStatus()
      return ticket
    } catch (e: any) {
      error.value = e.message || 'Falha ao abrir ticket'
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateSettings = async (updates: Partial<QueueSettings>) => {
    try {
      settings.value = await put<QueueSettings>('/queue/settings', updates)
      return true
    } catch (e: any) {
      error.value = e.message || 'Falha ao atualizar configurações'
      return false
    }
  }

  const applyPositions = (positions: { id: string; position: number }[]) => {
    queue.value = queue.value.map(u => {
      const pos = positions.find(p => p.id === u.id)
      if (pos) {
        return { ...u, queuePosition: pos.position }
      }
      return u
    })
  }

  const setupWebSocket = () => {
    ws.onEvent('queue:init', (data: { users: UserInQueue[]; settings: QueueSettings; isLocked: boolean; lockReason: LockReason }) => {
      queue.value = data.users
      settings.value = data.settings
      if (settings.value) {
        settings.value.locked = data.isLocked
      }
      initialized.value = true
    })

    ws.onEvent('queue:user_joined', (data: { user: UserInQueue; positions: { id: string; position: number }[] }) => {
      previousQueue.value = [...queue.value]
      queue.value.push(data.user)
      applyPositions(data.positions)
      if (data.user.id === auth.user?.id) {
        fetchMyStatus()
      }
    })

    ws.onEvent('queue:user_left', (data: { userId: string; positions: { id: string; position: number }[]; newTopUserId: string | null }) => {
      previousQueue.value = [...queue.value]
      queue.value = queue.value.filter(u => u.id !== data.userId)
      applyPositions(data.positions)
      if (data.userId === auth.user?.id || data.newTopUserId === auth.user?.id) {
        fetchMyStatus()
      }
    })

    ws.onEvent('queue:user_skipped', (data: { userId: string; positions: { id: string; position: number }[] }) => {
      previousQueue.value = [...queue.value]
      const user = queue.value.find(u => u.id === data.userId)
      if (user) {
        user.wasSkipped = true
      }
      applyPositions(data.positions)
      if (data.userId === auth.user?.id) {
        fetchMyStatus()
      }
    })

    ws.onEvent('queue:user_away', (data: { userId: string }) => {
      const user = queue.value.find(u => u.id === data.userId)
      if (user) {
        user.isIdle = true
      }
    })

    ws.onEvent('queue:user_reconnected', (data: { userId: string; position: number; positions: { id: string; position: number }[] }) => {
      const user = queue.value.find(u => u.id === data.userId)
      if (user) {
        user.isIdle = false
      }
      applyPositions(data.positions)
      if (data.userId === auth.user?.id) {
        fetchMyStatus()
      }
    })

    ws.onEvent('queue:user_removed', (data: { userId: string }) => {
      queue.value = queue.value.filter(u => u.id !== data.userId)
      if (data.userId === auth.user?.id) {
        fetchMyStatus()
      }
    })

    ws.onEvent('queue:positions_updated', (data: { positions: { id: string; position: number }[] }) => {
      applyPositions(data.positions)
    })

    ws.onEvent('queue:locked', (data: { locked: boolean; reason: LockReason }) => {
      if (settings.value) {
        settings.value.locked = data.locked
      }
    })

    ws.onEvent('queue:settings_changed', (newSettings: QueueSettings) => {
      settings.value = newSettings
      fetchQueue()
    })
  }

  const getWaitTime = (enteredAt: string | null): string => {
    if (!enteredAt) return '-'
    const entered = new Date(enteredAt)
    const now = new Date()
    const diff = Math.floor((now.getTime() - entered.getTime()) / 60000)
    if (diff < 1) return 'Agora'
    if (diff < 60) return `${diff} min`
    return `${Math.floor(diff / 60)}h ${diff % 60}m`
  }

  const initialize = async () => {
    if (initialized.value) return
    // Wait for WS to initialize implicitly by setting up the socket
    setupWebSocket()
    // Start heartbeat to keep user as active
    ws.startHeartbeat()
    // HTTP fallback fetch is mostly rendered redundant, but keeping as a safety measure
    if (queue.value.length === 0 && settings.value === null) {
      await Promise.all([
        fetchQueue(),
        fetchSettings(),
        fetchMyStatus(),
      ])
    }
    // If user is already in queue after initial fetch, send reconnect to restore from idle state
    if (isUserInQueue.value && !reconnecting.value) {
      reconnecting.value = true
      await reconnectUser()
      reconnecting.value = false
    }
    initialized.value = true
  }

  const fetchSnapshots = async (limit = 30) => {
    loadingSnapshots.value = true
    snapshotsError.value = null
    try {
      snapshots.value = await get<SnapshotData[]>('/queue/snapshots', { limit })
    } catch (e: any) {
      snapshotsError.value = e.message || 'Falha ao obter snapshots'
      console.error('Falha ao obter snapshots', e)
    } finally {
      loadingSnapshots.value = false
    }
  }

  const fetchSnapshotDetail = async (date: string, page = 1) => {
    loadingSnapshots.value = true
    snapshotsError.value = null
    try {
      currentSnapshotDetail.value = await get<SnapshotWithActions>(
        `/queue/snapshots/${date}/full`,
        { page, pageSize: 50 }
      )
    } catch (e: any) {
      snapshotsError.value = e.message || 'Falha ao obter detalhes do snapshot'
      console.error('Falha ao obter detalhes do snapshot', e)
    } finally {
      loadingSnapshots.value = false
    }
  }

  const fetchSnapshotsByRange = async (startDate: string, endDate: string, limit = 30) => {
    loadingSnapshots.value = true
    snapshotsError.value = null
    try {
      snapshots.value = await get<SnapshotData[]>(
        '/queue/snapshots',
        { startDate, endDate, limit }
      )
    } catch (e: any) {
      snapshotsError.value = e.message || 'Falha ao obter snapshots'
      console.error('Falha ao obter snapshots', e)
    } finally {
      loadingSnapshots.value = false
    }
  }

  const generateSnapshot = async () => {
    loadingSnapshots.value = true
    snapshotsError.value = null
    try {
      await post('/queue/snapshots/generate')
      await fetchSnapshots()
      return true
    } catch (e: any) {
      snapshotsError.value = e.message || 'Falha ao gerar snapshot'
      return false
    } finally {
      loadingSnapshots.value = false
    }
  }

  const fetchQueueConfig = async () => {
    try {
      settings.value = await get<QueueSettings>('/queue/settings/config')
    } catch (e: any) {
      error.value = e.message || 'Falha ao obter configurações'
    }
  }

  const updateQueueConfig = async (config: Partial<QueueSettings>) => {
    try {
      settings.value = await put<QueueSettings>('/queue/settings', config)
      return true
    } catch (e: any) {
      error.value = e.message || 'Falha ao atualizar configurações'
      return false
    }
  }



  return {
    initialized,
    queue,
    previousQueue,
    settings,
    currentUserStatus,
    loading,
    error,
    sortedQueue,
    currentUserInQueue,
    isUserInQueue,
    currentUserPosition,
    isUserTopOfQueue,
    canUserOpenTicket,
    isQueueLocked,
    lockReason,
    topOfQueue,
    nextUserAfterCurrent,
    activeUsers,
    idleUsers,
    fetchQueue,
    fetchMyStatus,
    fetchSettings,
    joinQueue,
    leaveQueue,
    reconnectUser,
    cleanup,
    openTicket,
    updateSettings,
    setupWebSocket,
    getWaitTime,
    reconnecting,
    initialize,
    snapshots,
    currentSnapshotDetail,
    loadingSnapshots,
    snapshotsError,
    fetchSnapshots,
    fetchSnapshotDetail,
    fetchSnapshotsByRange,
    generateSnapshot,
    fetchQueueConfig,
    updateQueueConfig,
  }
})
