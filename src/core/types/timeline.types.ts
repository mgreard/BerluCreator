import type { AssetCategory } from './asset.types'

export interface Transform2D {
  x: number
  y: number
  scaleX: number
  scaleY: number
  rotation: number
  opacity: number
}

export interface Keyframe {
  id: string
  /** Temps d'activation en millisecondes */
  timeMs: number
  /** ID de l'asset sprite à afficher (ou null pour masquer) */
  assetId: string | null
  /** Décalages géométriques optionnels par rapport à l'ancrage résolu */
  transform?: Partial<Transform2D>
  /** Étiquette contextuelle ou émotion (ex: 'smile', 'talk_O', 'gaze_left') */
  label?: string
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
  durationMs: number
  fps: number
  /** Groupes hiérarchiques de la séquence */
  groups?: TrackGroup[]
  tracks: TimelineTrack[]
  createdAt: number
  updatedAt: number
}

export interface PlaybackState {
  isPlaying: boolean
  currentTimeMs: number
  speed: number
  loop: boolean
  zoom: number // Facteur d'échelle d'affichage de la timeline (px / s)
  snapToGrid: boolean
  gridStepMs: number
}
