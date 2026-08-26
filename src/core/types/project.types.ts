export interface StageSettings {
  width: number
  height: number
  backgroundColor: string
  safeArea: boolean
  showGrid: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  stage: StageSettings
  activeSequenceId: string
  createdAt: number
  updatedAt: number
}
