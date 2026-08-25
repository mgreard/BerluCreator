import { ref, type Ref } from 'vue'

export interface ToastMessage {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  title: string
  message: string
  duration?: number
}

function generateToastId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const activeToasts = ref<ToastMessage[]>([])

export function showToast(
  type: ToastMessage['type'],
  title: string,
  message: string,
  duration = 5000
): string {
  const id = generateToastId()
  const toastItem: ToastMessage = { id, type, title, message, duration }

  activeToasts.value.push(toastItem)

  if (duration > 0 && typeof window !== 'undefined') {
    window.setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

export function removeToast(id: string): void {
  activeToasts.value = activeToasts.value.filter((t) => t.id !== id)
}

export const toast = {
  show: showToast,
  success: (title: string, message: string, duration?: number) =>
    showToast('success', title, message, duration),
  error: (title: string, message: string, duration?: number) =>
    showToast('error', title, message, duration),
  warning: (title: string, message: string, duration?: number) =>
    showToast('warning', title, message, duration),
  info: (title: string, message: string, duration?: number) =>
    showToast('info', title, message, duration),
  remove: removeToast,
  clear: () => {
    activeToasts.value = []
  }
}

export interface UseToastReturn {
  activeToasts: Ref<ToastMessage[]>
  toast: typeof toast
  showToast: typeof showToast
  removeToast: typeof removeToast
}

export function useToast(): UseToastReturn {
  return {
    activeToasts,
    toast,
    showToast,
    removeToast
  }
}

export const toastService = {
  activeToasts,
  showToast,
  removeToast,
  toast,
  useToast
}
