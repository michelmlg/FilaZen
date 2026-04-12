import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'

export interface TeamUser {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SELLER'
  avatarUrl?: string | null
  statusId?: string | null
  queuePosition?: number | null
  active: boolean
  status?: {
    id: string
    name: string
    meaning: string
  }
}

export const useTeamStore = defineStore('team', () => {
  const { get, post, patch, del } = useApi()
  const ws = useWebSocket()

  const users = ref<TeamUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async () => {
    loading.value = true
    error.value = null
    try {
      users.value = await get<TeamUser[]>('/users')
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (data: { name: string; email: string; role?: 'MANAGER' | 'SELLER' }) => {
    const response = await post<{ user: TeamUser; tempPassword: string }>('/users', data)
    users.value.push(response.user)
    return response
  }

  const updateRole = async (userId: string, role: 'MANAGER' | 'SELLER') => {
    const updatedUser = await patch<TeamUser>(`/users/${userId}/role`, { role })
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value[index] = updatedUser
    }
    return updatedUser
  }

  const resetPassword = async (userId: string) => {
    return await post<{ tempPassword: string; user: { id: string; name: string; email: string } }>(`/users/reset-password/${userId}`)
  }

  const deleteUser = async (userId: string) => {
    await del(`/users/${userId}`)
    users.value = users.value.filter(u => u.id !== userId)
  }

  const setupWebSocket = () => {
    ws.onEvent('user:status_changed', (data: { userId: string; name?: string; status?: string }) => {
      const index = users.value.findIndex(u => u.id === data.userId)
      if (index !== -1 && users.value[index]) {
        if (data.name) users.value[index]!.name = data.name
        if (data.status && users.value[index]) {
          users.value[index]!.status = {
            id: '',
            name: data.status,
            meaning: data.status
          }
        }
      }
    })
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateRole,
    resetPassword,
    deleteUser,
    setupWebSocket,
  }
})
