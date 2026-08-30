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
  /** Rôle optique du groupe. Absent dans les anciens documents = auto. */
  depthRole?: LayerDepthRole
  /** Distance optique du groupe : 0 = lointain, 0.5 = net, 1 = proche. */
  opticalDepth?: number
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

export type ColorGradingPreset =
  | 'neutral'
  | 'warm'
  | 'golden_hour'
  | 'studio'
  | 'night'
  | 'cartoon_punch'
  | 'custom'

export interface ColorGradingAdjustments {
  exposure: number
  contrast: number
  saturation: number
  temperature: number
  tint: number
}

export interface ColorGradingSettings extends ColorGradingAdjustments {
  enabled: boolean
  preset: ColorGradingPreset
}

export type ShaderPreset =
  | 'none'
  | 'film_grain'
  | 'vignette'
  | 'chromatic'
  | 'crt_retro'
  | 'vhs'
  | 'bloom'
  | 'custom'

export interface ShaderAdjustments {
  intensity: number
  grain: number
  aberration: number
  scanlines: number
  scanlinesDensity: number
  vignette: number
  bloom: number
}

export interface ShaderSettings extends ShaderAdjustments {
  enabled: boolean
  preset: ShaderPreset
}

export interface EditorDocument {
  id: string
  projectId: string
  name: string
  camera: CameraFrame
  depthOfField: DepthOfFieldSettings
  colorGrading: ColorGradingSettings
  shaderSettings: ShaderSettings
  layers: EditorLayer[]
  groups: EditorGroup[]
  rigCatalogSnapshot?: string
  createdAt: number
  updatedAt: number
}

export interface ViewportSnapshot {
  id: string
  name: string
  thumbnailDataUrl: string
  camera: CameraFrame
  depthOfField: DepthOfFieldSettings
  colorGrading: ColorGradingSettings
  shaderSettings: ShaderSettings
  layers: EditorLayer[]
  groups: EditorGroup[]
  rigCatalogSnapshot?: string
  createdAt: number
  updatedAt: number
}
