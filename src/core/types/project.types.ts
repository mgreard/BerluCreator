import type { Asset, AssetBlobRecord } from './asset.types'
import type { CharacterPreset } from './character.types'
import type { EditorDocument, ViewportSnapshot } from './editor.types'
import type { LegacySavedKeyframePreset, LegacySequence } from '@infrastructure/db/legacy-migration'

export interface StageSettings {
  width: number
  height: number
  backgroundColor: string
}

export interface Project {
  id: string
  stage: StageSettings
  editorDocumentId: string
  /** Champ de migration conservé temporairement lors de la transition */
  activeSequenceId?: string
  createdAt: number
  updatedAt: number
}

export interface WorkspaceSnapshot {
  id: 'manual'
  schemaVersion: 1 | 2 | 3
  activeProjectId: string
  createdAt: number
  projects: Project[]
  editorDocuments?: EditorDocument[]
  viewportSnapshots?: ViewportSnapshot[]
  assets: Asset[]
  assetBlobs: AssetBlobRecord[]
  characters: CharacterPreset[]
  /** Champs hérités pour les sauvegardes v1 et v2 */
  sequences?: LegacySequence[]
  savedKeyframes?: LegacySavedKeyframePreset[]
}

export interface WorkspaceSnapshotSummary {
  createdAt: number
  assetCount: number
  viewportSnapshotCount: number
  totalBlobSize: number
}

export type WorkspaceBackupStatus =
  | 'checking'
  | 'no_snapshot'
  | 'saved'
  | 'dirty'
  | 'saving'
  | 'error'
