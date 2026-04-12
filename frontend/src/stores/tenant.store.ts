import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'

export interface TenantConfig {
  id: string
  name: string
  slug: string
  primaryColor?: string
  logoUrl?: string | null
  backgroundColor?: string
}

export const useTenantStore = defineStore('tenant', () => {
  const { get, put } = useApi()

  const config = ref<TenantConfig | null>(null)
  const loading = ref(false)

  const hexToHsl = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return hex

    const r = parseInt(result[1]!, 16) / 255
    const g = parseInt(result[2]!, 16) / 255
    const b = parseInt(result[3]!, 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
        case g: h = ((b - r) / d + 2) / 6; break
        case b: h = ((r - g) / d + 4) / 6; break
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)} ${Math.round(l * 100)}%`
  }

  const fetchConfig = async () => {
    loading.value = true
    try {
      config.value = await get<TenantConfig>('/tenants/me')
      applyThemeColors()
    } catch (e) {
      console.error('Falha ao carregar config do tenant', e)
    } finally {
      loading.value = false
    }
  }

  const applyThemeColors = (primaryColor?: string) => {
    const color = primaryColor || config.value?.primaryColor
    if (color) {
      const hsl = hexToHsl(color)
      document.documentElement.style.setProperty('--primary', hsl)

      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color)
      if (result) {
        const r = parseInt(result[1]!, 16)
        const g = parseInt(result[2]!, 16)
        const b = parseInt(result[3]!, 16)
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        const foreground = luminance > 0.5 ? '222.2 47.4% 11.2%' : '210 40% 98%'
        document.documentElement.style.setProperty('--primary-foreground', foreground)
      }
    }
  }

  const saveSettings = async (settings: Partial<TenantConfig>) => {
    loading.value = true
    try {
      await put('/tenants/settings', settings)
      await fetchConfig()
      return true
    } catch (e) {
      console.error('Erro ao salvar settings', e)
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    config,
    loading,
    fetchConfig,
    applyThemeColors,
    saveSettings,
  }
})
