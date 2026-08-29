import type { AssetCategory } from './asset.types'

export interface Transform2D {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
}

export const IDENTITY_TRANSFORM: Transform2D = {
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
  opacity: 1
}

export type CameraAspectRatio = '16:9' | '9:16' | '1:1' | 'custom'

export interface CameraFrame {
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
  aspectRatio: CameraAspectRatio
}

export interface DepthOfFieldSettings {
  enabled: boolean
  focusY: number
  feather: number
  blurRadius: number
}

export type LayerDepthRole = 'auto' | 'background' | 'subject'

export type EditorGroupColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'cyan'
export type CharacterMode = 'full' | 'rig'

interface EditorGroupBase {
  id: string
  name: string
  kind: 'stage' | 'character'
  zIndex: number
  transform: Transform2D
  muted: boolean
  locked: boolean
  collapsed: boolean
  color: EditorGroupColor
  isDefault: boolean
}

export interface StageGroup extends EditorGroupBase {
  kind: 'stage'
  allowedCategories: AssetCategory[]
}

export interface CharacterGroup extends EditorGroupBase {
  kind: 'character'
  characterKey: string
  activeMode: CharacterMode
  /** Profil de corps actif dans le catalogue global de rigs. */
  activeRigId?: string
  allowedCategories: AssetCategory[]
}

export type EditorGroup = StageGroup | CharacterGroup

export interface EditorLayer {
  id: string
  assetId: string
  name: string
  category: AssetCategory
  groupId: string
  zIndex: number
  order: number
  muted: boolean
  locked: boolean
  /** Rôle optique de cette instance. Absent dans les anciens documents = auto. */
  depthRole?: LayerDepthRole
  /** Distance optique indépendante du z-index : 0 = lointain, 0.5 = net, 1 = proche. */
  opticalDepth?: number
  transform: Transform2D
}

export interface EditorDocument {
  id: string
  projectId: string
  name: string
  camera: CameraFrame
  depthOfField: DepthOfFieldSettings
  layers: EditorLayer[]
  groups: EditorGroup[]
  createdAt: number
  updatedAt: number
}

export interface ViewportSnapshot {
  id: string
  name: string
  thumbnailDataUrl: string
  camera: CameraFrame
  depthOfField: DepthOfFieldSettings
  layers: EditorLayer[]
  groups: EditorGroup[]
  createdAt: number
  updatedAt: number
}
