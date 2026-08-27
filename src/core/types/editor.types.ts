import type { AssetCategory } from './asset.types'

export interface Transform2D {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
}

export type CameraAspectRatio = '16:9' | '9:16' | '1:1' | 'custom'

/** Zone de capture exprimée dans les coordonnées natives du plateau. */
export interface CameraFrame {
  enabled: boolean
  x: number
  y: number
  width: number
  height: number
  aspectRatio: CameraAspectRatio
}

/**
 * Paramètres de transformation globale du squelette de personnage (Rig).
 * Déplace et redimensionne solidairement l'ensemble des slots du corps.
 */
export interface CharacterRigTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  visible: boolean
  zIndex: number
}

export type EditorGroupColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'cyan'

export interface EditorGroup {
  id: string
  name: string
  zIndex: number
  transform?: Partial<Transform2D>
  muted?: boolean
  locked?: boolean
  collapsed?: boolean
  color?: EditorGroupColor
  allowedCategories: AssetCategory[]
  isDefault?: boolean
  customCategory?: string
}

/**
 * Calque individuel plat sur le plateau.
 * Pour un slot du personnage : positionné relativement au Rig (`character`).
 * Pour un élément de décor/scène : positionné directement sur le plateau.
 */
export interface EditorLayer {
  id: string
  assetId: string
  name: string
  category: AssetCategory
  zIndex: number
  localX?: number
  localY?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  muted: boolean
  locked: boolean
  transform?: Partial<Transform2D>
  /** Optionnel pour transition / rétro-compatibilité */
  groupId?: string
  order?: number
}

export interface EditorDocument {
  id: string
  projectId: string
  name: string
  camera: CameraFrame
  character: CharacterRigTransform
  layers: EditorLayer[]
  groups?: EditorGroup[]
  createdAt: number
  updatedAt: number
}

/**
 * Composition nommée réutilisable du viewport (pose/cadrage/calques),
 * distincte d'une sauvegarde manuelle complète de l'application.
 */
export interface ViewportSnapshot {
  id: string
  name: string
  thumbnailDataUrl: string
  camera: CameraFrame
  character: CharacterRigTransform
  layers: EditorLayer[]
  groups?: EditorGroup[]
  createdAt: number
  updatedAt: number
}
