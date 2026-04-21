const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1'
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000'

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  apiPrefix: API_PREFIX,
  wsUrl: WS_URL,
  apiUrl: `${API_BASE_URL}${API_PREFIX}`,
} as const

export const getApiUrl = (endpoint: string) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_CONFIG.apiUrl}${cleanEndpoint}`
}
