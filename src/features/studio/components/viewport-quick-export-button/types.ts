export type QuickExportStatus = 'idle' | 'exporting' | 'success' | 'error'

export interface ViewportQuickExportButtonProps {
  disabled?: boolean
}

export interface ViewportQuickExportButtonEmits {
  (event: 'exported', dataUrl: string): void
}

export interface ViewportQuickExportButtonExpose {
  triggerExport: () => Promise<string | null>
  status: QuickExportStatus
}
