import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'
import { useTenantStore } from '@/stores/tenant.store'

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SELLER'
  isOwner?: boolean
  avatarUrl?: string | null
  tenantId: string
  statusId?: string | null
  queuePosition?: number | null
}

export interface TenantOption {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

interface LoginResponse {
  token?: string
  user?: User
  tenants?: TenantOption[]
  needsSelection?: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const { post, get } = useApi()
  const ws = useWebSocket()

  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Multi-tenant selection state
  const pendingTenants = ref<TenantOption[]>([])
  const pendingEmail = ref('')
  const pendingPassword = ref('')

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isManager = computed(() => user.value?.role === 'MANAGER' || user.value?.role === 'ADMIN')
  const needsTenantSelection = computed(() => pendingTenants.value.length > 0)

  const setToken = (newToken: string | null) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
      ws.connect(newToken)
    } else {
      localStorage.removeItem('token')
      ws.disconnect()
    }
  }

  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true
    error.value = null
    pendingTenants.value = []
    try {
      const response = await post<LoginResponse>('/auth/login', credentials)

      if (response.needsSelection && response.tenants) {
        // Múltiplos tenants — salvar estado para seleção
        pendingTenants.value = response.tenants
        pendingEmail.value = credentials.email
        pendingPassword.value = credentials.password
        return 'select-tenant'
      }

      // Login direto (1 tenant)
      if (response.token && response.user) {
        user.value = response.user
        setToken(response.token)
        return 'success'
      }

      error.value = 'Resposta inesperada do servidor.'
      return 'error'
    } catch (err: any) {
      error.value = err.message || 'Erro ao fazer login'
      return 'error'
    } finally {
      loading.value = false
    }
  }

  const selectTenant = async (tenantSlug: string) => {
    loading.value = true
    error.value = null
    try {
      const response = await post<{ token: string; user: User }>('/auth/select-tenant', {
        email: pendingEmail.value,
        password: pendingPassword.value,
        tenantSlug,
      })

      user.value = response.user
      setToken(response.token)
      clearPending()
      return true
    } catch (err: any) {
      error.value = err.message || 'Erro ao selecionar tenant'
      return false
    } finally {
      loading.value = false
    }
  }

  const clearPending = () => {
    pendingTenants.value = []
    pendingEmail.value = ''
    pendingPassword.value = ''
  }

  const checkAuth = async () => {
    if (!token.value) return false

    loading.value = true
    try {
      const currentUser = await get<User>('/auth/me')
      user.value = currentUser
      ws.connect(token.value)
      return true
    } catch {
      logout()
      return false
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    const tenant = useTenantStore()
    tenant.resetThemeColors()
    user.value = null
    clearPending()
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
    needsTenantSelection,
    pendingTenants,
    login,
    selectTenant,
    clearPending,
    logout,
    checkAuth,
  }
})
