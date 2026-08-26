import type { AssetCategory } from './asset.types'

export interface Transform2D {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
}

export interface KeyframeSprite {
  id: string
  assetId: string
  transform?: Partial<Transform2D>
  label?: string
  /** Ordre local au sein d'une même piste et d'une même keyframe. */
  order: number
}

export interface Keyframe {
  id: string
  /** Étape discrète à laquelle ce changement devient actif. */
  stepId: string
  /** Sprites affichés simultanément par cette piste à cette étape. */
  sprites: KeyframeSprite[]
}

export interface SequenceStep {
  id: string
  label: string
  order: number
}

export type TrackGroupColor = 'indigo' | 'emerald' | 'amber' | 'rose' | 'blue' | 'purple' | 'cyan'

export interface TrackGroup {
  id: string
  name: string
  /** Z-Index global du groupe sur le Canvas (ex: Décor=0, Personnage=20, Bureau=30, Overlays=50) */
  zIndex: number
  /** Décalage géométrique global appliqué à l'ensemble des enfants du groupe */
  transform?: Partial<Transform2D>
  muted?: boolean
  locked?: boolean
  collapsed?: boolean
  color?: TrackGroupColor
}

export interface TimelineTrack {
  id: string
  name: string
  category: AssetCategory
  targetSlot: AssetCategory
  /** ID du groupe parent auquel appartient la piste */
  groupId?: string
  /** Z-Index local à l'intérieur du groupe */
  zIndex: number
  muted: boolean
  locked: boolean
  keyframes: Keyframe[]
}

export interface Sequence {
  id: string
  projectId: string
  name: string
  steps: SequenceStep[]
  /** Groupes hiérarchiques de la séquence */
  groups?: TrackGroup[]
  tracks: TimelineTrack[]
  createdAt: number
  updatedAt: number
}

export interface SavedKeyframeSprite {
  assetId: string
  transform?: Partial<Transform2D>
  label?: string
  order: number
}

export interface SavedKeyframeTrack {
  sourceTrackId: string
  name: string
  category: AssetCategory
  targetSlot: AssetCategory
  sourceGroupId?: string
  zIndex: number
  sprites: SavedKeyframeSprite[]
}

export interface SavedKeyframeGroup {
  sourceGroupId: string
  name: string
  zIndex: number
  transform?: Partial<Transform2D>
}

/** Pose de scène réutilisable, distincte d'une sauvegarde complète de l'application. */
export interface SavedKeyframePreset {
  id: string
  name: string
  sourceStepLabel?: string
  /** Champ historique lu uniquement lors de la migration des anciennes données. */
  sourceTimeMs?: number
  thumbnailDataUrl: string
  tracks: SavedKeyframeTrack[]
  groups: SavedKeyframeGroup[]
  createdAt: number
  updatedAt: number
}

export interface SequenceNavigationState {
  activeStepId: string
}
