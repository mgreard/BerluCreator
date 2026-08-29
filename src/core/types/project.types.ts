import type { Asset, AssetBlobRecord } from './asset.types'
import type { EditorDocument, ViewportSnapshot } from './editor.types'

export interface StageSettings {
  width: number
  height: number
  backgroundColor: string
}

export interface Project {
  id: string
  stage: StageSettings
  editorDocumentId: string
  createdAt: number
  updatedAt: number
}

export interface WorkspaceSnapshot {
  id: 'manual'
  schemaVersion: 4 | 5
  activeProjectId: string
  createdAt: number
  projects: Project[]
  editorDocuments: EditorDocument[]
  viewportSnapshots: ViewportSnapshot[]
  assets: Asset[]
  assetBlobs: AssetBlobRecord[]
  /** Catalogue de rigs sérialisé. Absent uniquement sur les snapshots legacy v4. */
  rigCatalogJson?: string
}

export interface WorkspaceSnapshotSummary {
  createdAt: number
  assetCount: number
  viewportSnapshotCount: number
  totalBlobSize: number
}

export type WorkspaceBackupStatus =
  'checking' | 'no_snapshot' | 'saved' | 'dirty' | 'saving' | 'error'
