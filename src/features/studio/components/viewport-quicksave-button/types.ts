import type { ViewportSnapshot } from '@core/types/editor.types'

export type QuicksaveStatus = 'idle' | 'saving' | 'success' | 'error'

export interface ViewportQuicksaveButtonProps {
  disabled?: boolean
}

export interface ViewportQuicksaveButtonEmits {
  (event: 'saved', snapshot: ViewportSnapshot): void
}

export interface ViewportQuicksaveButtonExpose {
  triggerSave: () => Promise<ViewportSnapshot | null>
  status: QuicksaveStatus
}
