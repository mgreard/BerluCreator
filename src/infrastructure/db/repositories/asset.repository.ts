import { db } from '../dexie'
import type { Asset, AssetBlobRecord, AssetCategory } from '@core/types/asset.types'

export class AssetRepository {
  async getAll(): Promise<Asset[]> {
    return await db.assets.toArray()
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
      await db.assets.put(asset)
    })
  }

  async update(id: string, changes: Partial<Asset>): Promise<void> {
    await db.assets.update(id, {
      ...changes,
      updatedAt: Date.now()
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

  async getBlob(blobId: string): Promise<Blob | undefined> {
    const record = await db.assetBlobs.get(blobId)
    return record?.data
  }
}

export const assetRepository = new AssetRepository()
