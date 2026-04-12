import { ref } from 'vue'
import { API_CONFIG } from '@/config/api'

interface FetchOptions extends RequestInit {
  query?: Record<string, any>
}

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getToken = () => localStorage.getItem('token')

  const fetchApi = async <T>(endpoint: string, options: FetchOptions = {}): Promise<T> => {
    loading.value = true
    error.value = null

    try {
      const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
      let url = `${API_CONFIG.apiUrl}${cleanEndpoint}`

      if (options.query) {
        const params = new URLSearchParams(options.query)
        url += `?${params.toString()}`
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      const token = getToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        let errorMsg = 'Erro na requisição'
        try {
          const errorData = await response.json()
          errorMsg = errorData.message || errorMsg
        } catch {
          errorMsg = response.statusText
        }
        throw new Error(errorMsg)
      }

      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (err: any) {
      error.value = err.message || 'Network Error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const get = <T>(endpoint: string, query?: Record<string, any>) => fetchApi<T>(endpoint, { method: 'GET', query })
  const post = <T>(endpoint: string, data?: any) => fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(data) })
  const put = <T>(endpoint: string, data?: any) => fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) })
  const patch = <T>(endpoint: string, data?: any) => fetchApi<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) })
  const del = <T>(endpoint: string) => fetchApi<T>(endpoint, { method: 'DELETE' })

  return { loading, error, get, post, put, patch, del }
}
