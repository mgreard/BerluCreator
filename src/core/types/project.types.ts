import type { Asset, AssetBlobRecord } from './asset.types'
import type { CharacterPreset } from './character.types'
import type { Sequence } from './timeline.types'

export interface StageSettings {
  width: number
  height: number
  backgroundColor: string
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

export interface WorkspaceSnapshot {
  id: 'manual'
  schemaVersion: 1
  activeProjectId: string
  createdAt: number
  projects: Project[]
  sequences: Sequence[]
  assets: Asset[]
  assetBlobs: AssetBlobRecord[]
  characters: CharacterPreset[]
}

export interface WorkspaceSnapshotSummary {
  createdAt: number
  assetCount: number
  totalBlobSize: number
}
