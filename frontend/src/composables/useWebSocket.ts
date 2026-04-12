import { ref, onUnmounted, getCurrentInstance } from 'vue'
import { io, Socket } from 'socket.io-client'
import { useToast } from './useToast'
import { API_CONFIG } from '@/config/api'

const socket = ref<Socket | null>(null)
const isConnected = ref(false)

export function useWebSocket() {
  const toast = useToast()

  const connect = (token: string) => {
    if (socket.value) return

    socket.value = io(API_CONFIG.wsUrl, {
      auth: { token },
      transports: ['websocket'],
    })

    socket.value.on('connect', () => {
      isConnected.value = true
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
    })

    socket.value.on('connect_error', () => {
      isConnected.value = false
    })

    socket.value.on('notification', (data: { type: string; title: string; message?: string }) => {
      switch (data.type) {
        case 'success':
          toast.success(data.title, data.message)
          break
        case 'error':
          toast.error(data.title, data.message)
          break
        case 'warning':
          toast.warning(data.title, data.message)
          break
        default:
          toast.info(data.title, data.message)
      }
    })

    socket.value.on('user:status_changed', (data: { userId: string; name: string; status: string }) => {
      toast.info(`${data.name} está ${data.status}`)
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const onEvent = (event: string, callback: (...args: any[]) => void) => {
    if (!socket.value) {
      console.warn(`[useWebSocket] Socket is not connected, cannot bind event: ${event}`)
      return
    }
    socket.value.on(event, callback)

    if (getCurrentInstance()) {
      onUnmounted(() => {
        if (socket.value) {
          socket.value.off(event, callback)
        }
      })
    }
  }

  let heartbeatInterval: ReturnType<typeof setInterval> | null = null

  const startHeartbeat = (intervalMs = 30000) => {
    if (heartbeatInterval) return
    socket.value?.emit('user:heartbeat')
    heartbeatInterval = setInterval(() => {
      if (socket.value?.connected) {
        socket.value.emit('user:heartbeat')
      }
    }, intervalMs)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  const emitOffline = () => {
    stopHeartbeat()
    if (socket.value?.connected) {
      socket.value.emit('user:offline')
    }
  }

  return {
    socket,
    isConnected,
    connect,
    disconnect,
    onEvent,
    startHeartbeat,
    stopHeartbeat,
    emitOffline,
  }
}
