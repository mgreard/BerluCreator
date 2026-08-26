import type { SavedKeyframePreset } from '@core/types/timeline.types'
import { db } from '../dexie'

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export class SavedKeyframeRepository {
  async getAll(): Promise<SavedKeyframePreset[]> {
    return await db.savedKeyframes.orderBy('createdAt').reverse().toArray()
  }

  async create(preset: SavedKeyframePreset): Promise<void> {
    await db.savedKeyframes.put(toPlain(preset))
  }

  async delete(id: string): Promise<void> {
    await db.savedKeyframes.delete(id)
  }
}

export const savedKeyframeRepository = new SavedKeyframeRepository()
