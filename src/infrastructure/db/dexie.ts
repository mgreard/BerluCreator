import Dexie, { type EntityTable } from 'dexie'
import type { Asset, AssetBlobRecord } from '@core/types/asset.types'
import type { Project } from '@core/types/project.types'
import type { Sequence } from '@core/types/timeline.types'
import type { CharacterPreset } from '@core/types/character.types'

export class BerluDatabase extends Dexie {
  assets!: EntityTable<Asset, 'id'>
  assetBlobs!: EntityTable<AssetBlobRecord, 'id'>
  projects!: EntityTable<Project, 'id'>
  sequences!: EntityTable<Sequence, 'id'>
  characters!: EntityTable<CharacterPreset, 'id'>

  constructor() {
    super('BerluCreatorDB')

    this.version(1).stores({
      assets: 'id, name, category, *tags, blobId, createdAt, updatedAt',
      assetBlobs: 'id, mimeType, createdAt',
      projects: 'id, name, createdAt, updatedAt',
      sequences: 'id, projectId, createdAt, updatedAt',
      characters: 'id, name, createdAt, updatedAt'
    })
  }
}

export const db = new BerluDatabase()
