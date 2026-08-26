import type { Asset, AssetBlobRecord } from './asset.types'
import type { CharacterPreset } from './character.types'
import type { SavedKeyframePreset, Sequence } from './timeline.types'

export interface StageSettings {
  width: number
  height: number
  backgroundColor: string
}

export interface Project {
  id: string
  stage: StageSettings
  activeSequenceId: string
  createdAt: number
  updatedAt: number
}

export interface WorkspaceSnapshot {
  id: 'manual'
  schemaVersion: 1 | 2
  activeProjectId: string
  createdAt: number
  projects: Project[]
  sequences: Sequence[]
  assets: Asset[]
  assetBlobs: AssetBlobRecord[]
  characters: CharacterPreset[]
  savedKeyframes?: SavedKeyframePreset[]
}

export interface WorkspaceSnapshotSummary {
  createdAt: number
  assetCount: number
  savedKeyframeCount: number
  totalBlobSize: number
}

export type WorkspaceBackupStatus =
  | 'checking'
  | 'no_snapshot'
  | 'saved'
  | 'dirty'
  | 'saving'
  | 'error'
