import { ref, readonly } from 'vue'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const add = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }
    toasts.value.push(newToast)

    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }

    return id
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) toasts.value.splice(index, 1)
  }

  const success = (title: string, message?: string) => add({ type: 'success', title, message })
  const error = (title: string, message?: string) => add({ type: 'error', title, message })
  const warning = (title: string, message?: string) => add({ type: 'warning', title, message })
  const info = (title: string, message?: string) => add({ type: 'info', title, message })

  return {
    toasts: readonly(toasts),
    add,
    remove,
    success,
    error,
    warning,
    info,
  }
}
