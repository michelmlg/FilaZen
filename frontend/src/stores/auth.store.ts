import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SELLER'
  avatarUrl?: string | null
  tenantId: string
  statusId?: string | null
  queuePosition?: number | null
}

export const useAuthStore = defineStore('auth', () => {
  const { post, get } = useApi()
  const ws = useWebSocket()

  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isManager = computed(() => user.value?.role === 'MANAGER' || user.value?.role === 'ADMIN')

  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
      ws.connect(newToken) // Conecta WebSocket assim que o token é setado
    } else {
      localStorage.removeItem('token')
      ws.disconnect()
    }
  }

  const login = async (credentials: { email: string; password: string; tenantSlug: string }) => {
    loading.value = true
    error.value = null
    try {
      const response = await post<{ token: string; user: User }>('/auth/login', credentials)
      user.value = response.user
      setToken(response.token)
      return true
    } catch (err: any) {
      error.value = err.message || 'Erro ao fazer login'
      return false
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    if (!token.value) return false
    
    loading.value = true
    try {
      const currentUser = await get<User>('/auth/me')
      user.value = currentUser
      ws.connect(token.value) // Garantir WS conectado caso dê um F5 na página
      return true
    } catch {
      logout()
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    user.value = null
    setToken(null)
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isManager,
    login,
    logout,
    checkAuth,
  }
})
