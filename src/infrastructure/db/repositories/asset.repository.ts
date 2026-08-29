import { db } from '../dexie'
import type { Asset, AssetBlobRecord, AssetCategory } from '@core/types/asset.types'
import type { CharacterGroup, EditorDocument } from '@core/types/editor.types'

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export class AssetRepository {
  async getAll(): Promise<Asset[]> {
    return await db.assets.toArray()
  }

  async list(): Promise<Asset[]> {
    return await this.getAll()
  }

  async getById(id: string): Promise<Asset | undefined> {
    return await db.assets.get(id)
  }

  async getByCategory(category: AssetCategory): Promise<Asset[]> {
    return await db.assets.where('category').equals(category).toArray()
  }

  async create(asset: Asset, blob: Blob): Promise<void> {
    const blobRecord: AssetBlobRecord = {
      id: asset.blobId,
      mimeType: blob.type || 'image/png',
      data: blob,
      size: blob.size,
      createdAt: Date.now()
    }

    await db.transaction('rw', [db.assets, db.assetBlobs], async () => {
      await db.assetBlobs.put(blobRecord)
      await db.assets.put(toPlain(asset))
    })
  }

  async update(id: string, changes: Partial<Asset>): Promise<void> {
    await db.assets.update(id, {
      ...toPlain(changes),
      updatedAt: Date.now()
    })
  }

  async replaceBlob(
    assetId: string,
    blobId: string,
    blob: Blob,
    changes: Partial<Asset>
  ): Promise<void> {
    const asset = await db.assets.get(assetId)
    if (!asset) throw new Error(`Asset introuvable : ${assetId}`)

    const blobRecord: AssetBlobRecord = {
      id: blobId,
      mimeType: blob.type || 'image/png',
      data: blob,
      size: blob.size,
      createdAt: Date.now()
    }

    await db.transaction('rw', [db.assets, db.assetBlobs], async () => {
      await db.assetBlobs.put(blobRecord)
      await db.assets.update(assetId, {
        ...toPlain(changes),
        blobId,
        updatedAt: Date.now()
      })
      await db.assetBlobs.delete(asset.blobId)
    })
  }

  async delete(id: string): Promise<void> {
    const asset = await db.assets.get(id)
    if (!asset) return

    await db.transaction('rw', [db.assets, db.assetBlobs], async () => {
      await db.assets.delete(id)
      await db.assetBlobs.delete(asset.blobId)
    })
  }

  async inspectDeletion(id: string): Promise<{
    layerCount: number
    snapshotNames: string[]
  }> {
    const [documents, snapshots] = await Promise.all([
      db.editorDocuments.toArray(),
      db.viewportSnapshots.toArray()
    ])
    return {
      layerCount: documents.reduce(
        (total, document) => total + document.layers.filter((layer) => layer.assetId === id).length,
        0
      ),
      snapshotNames: snapshots
        .filter((snapshot) => snapshot.layers.some((layer) => layer.assetId === id))
        .map((snapshot) => snapshot.name)
    }
  }

  async deleteCascade(id: string): Promise<number> {
    const asset = await db.assets.get(id)
    if (!asset) return 0

    return await db.transaction(
      'rw',
      [db.assets, db.assetBlobs, db.editorDocuments, db.viewportSnapshots],
      async () => {
        const snapshots = await db.viewportSnapshots.toArray()
        if (snapshots.some((snapshot) => snapshot.layers.some((layer) => layer.assetId === id))) {
          throw new Error('Cet asset est utilisé par une vue sauvegardée.')
        }

        const documents = await db.editorDocuments.toArray()
        let removedLayers = 0
        for (const document of documents) {
          const removed = document.layers.filter((layer) => layer.assetId === id)
          if (removed.length === 0) continue
          removedLayers += removed.length
          document.layers = document.layers.filter((layer) => layer.assetId !== id)
          reconcileCharacterModes(document, new Set(removed.map((layer) => layer.groupId)))
          await db.editorDocuments.put(toPlain(document))
        }

        await db.assets.delete(id)
        await db.assetBlobs.delete(asset.blobId)
        return removedLayers
      }
    )
  }

  async getBlob(blobId: string): Promise<Blob | undefined> {
    const record = await db.assetBlobs.get(blobId)
    return record?.data
  }
}

function reconcileCharacterModes(document: EditorDocument, groupIds: Set<string>): void {
  for (const groupId of groupIds) {
    const group = document.groups.find(
      (candidate): candidate is CharacterGroup => candidate.id === groupId && candidate.kind === 'character'
    )
    if (!group || group.activeMode !== 'full') continue
    const hasFull = document.layers.some(
      (layer) => layer.groupId === group.id && layer.category === 'character_full'
    )
    const hasRig = document.layers.some(
      (layer) => layer.groupId === group.id && layer.category !== 'character_full'
    )
    if (!hasFull && hasRig) group.activeMode = 'rig'
  }
}

export const assetRepository = new AssetRepository()
