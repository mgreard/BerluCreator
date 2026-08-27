import Dexie, { type EntityTable } from 'dexie'
import type { Asset, AssetBlobRecord } from '@core/types/asset.types'
import type { Project, WorkspaceSnapshot } from '@core/types/project.types'
import type { EditorDocument, ViewportSnapshot } from '@core/types/editor.types'
import type { CharacterPreset } from '@core/types/character.types'
import {
  convertLegacySequence,
  convertLegacySavedKeyframe,
  type LegacySavedKeyframePreset,
  type LegacySequence
} from './legacy-migration'

export class BerluDatabase extends Dexie {
  assets!: EntityTable<Asset, 'id'>
  assetBlobs!: EntityTable<AssetBlobRecord, 'id'>
  projects!: EntityTable<Project, 'id'>
  editorDocuments!: EntityTable<EditorDocument, 'id'>
  viewportSnapshots!: EntityTable<ViewportSnapshot, 'id'>
  characters!: EntityTable<CharacterPreset, 'id'>
  workspaceSnapshots!: EntityTable<WorkspaceSnapshot, 'id'>

  // Tables legacy conservées pour typage lors des montées de version Dexie
  sequences!: EntityTable<LegacySequence, 'id'>
  savedKeyframes!: EntityTable<LegacySavedKeyframePreset, 'id'>

  constructor() {
    super('BerluCreatorDB')

    this.version(1).stores({
      assets: 'id, name, category, *tags, blobId, createdAt, updatedAt',
      assetBlobs: 'id, mimeType, createdAt',
      projects: 'id, name, createdAt, updatedAt',
      sequences: 'id, projectId, createdAt, updatedAt',
      characters: 'id, name, createdAt, updatedAt'
    })

    this.version(2).stores({
      assets: 'id, name, category, *tags, blobId, createdAt, updatedAt',
      assetBlobs: 'id, mimeType, createdAt',
      projects: 'id, name, createdAt, updatedAt',
      sequences: 'id, projectId, createdAt, updatedAt',
      characters: 'id, name, createdAt, updatedAt',
      workspaceSnapshots: 'id, createdAt'
    })

    this.version(3).stores({
      assets: 'id, name, category, *tags, blobId, createdAt, updatedAt',
      assetBlobs: 'id, mimeType, createdAt',
      projects: 'id, createdAt, updatedAt',
      sequences: 'id, projectId, createdAt, updatedAt',
      characters: 'id, name, createdAt, updatedAt',
      workspaceSnapshots: 'id, createdAt',
      savedKeyframes: 'id, name, createdAt, updatedAt'
    })

    this.version(4)
      .stores({
        assets: 'id, name, category, *tags, blobId, createdAt, updatedAt',
        assetBlobs: 'id, mimeType, createdAt',
        projects: 'id, createdAt, updatedAt',
        editorDocuments: 'id, projectId, createdAt, updatedAt',
        viewportSnapshots: 'id, name, createdAt, updatedAt',
        characters: 'id, name, createdAt, updatedAt',
        workspaceSnapshots: 'id, createdAt',
        sequences: null,
        savedKeyframes: null
      })
      .upgrade(async (tx) => {
        // Migration transactionnelle v3 -> v4
        const legacySequences = await tx.table('sequences').toArray()
        const legacySavedKeyframes = await tx.table('savedKeyframes').toArray()
        const projects = await tx.table('projects').toArray()

        for (const seq of legacySequences) {
          const { document, snapshots } = convertLegacySequence(seq)
          await tx.table('editorDocuments').put(document)
          for (const snap of snapshots) {
            await tx.table('viewportSnapshots').put(snap)
          }

          // Mettre à jour le projet associé
          const matchingProject = projects.find((p) => p.id === seq.projectId)
          if (matchingProject) {
            matchingProject.editorDocumentId = document.id
            await tx.table('projects').put(matchingProject)
          }
        }

        for (const preset of legacySavedKeyframes) {
          const snapshot = convertLegacySavedKeyframe(preset)
          await tx.table('viewportSnapshots').put(snapshot)
        }
      })
  }
}

export const db = new BerluDatabase()
