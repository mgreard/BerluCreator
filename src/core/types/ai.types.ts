import type { AssetCategory } from './asset.types'

export interface AIScriptBeat {
  /** Timestamp d'activation en millisecondes */
  timeMs: number
  /** Calque ou partie du corps ciblée */
  targetSlot: AssetCategory
  /** Action ou émotion recherchée (ex: 'smile', 'look_left', 'raise_mic', 'breaking_news') */
  action: string
  /** Tag d'asset recommandé pour le matching */
  suggestedTag?: string
  /** Justification de la mise en scène */
  reasoning?: string
}

export interface AIGenerationRequest {
  scriptText: string
  durationMs: number
  availableAssetTags: string[]
  characterContext?: string
}

export interface AIGenerationResponse {
  summary: string
  beats: AIScriptBeat[]
}
