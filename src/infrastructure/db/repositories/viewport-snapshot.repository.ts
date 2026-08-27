import { db } from '../dexie'
import type { ViewportSnapshot } from '@core/types/editor.types'

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export class ViewportSnapshotRepository {
  async getAll(): Promise<ViewportSnapshot[]> {
    return await db.viewportSnapshots.orderBy('createdAt').reverse().toArray()
  }

  async getById(id: string): Promise<ViewportSnapshot | undefined> {
    return await db.viewportSnapshots.get(id)
  }

  async create(snapshot: ViewportSnapshot): Promise<void> {
    await db.viewportSnapshots.put(toPlain(snapshot))
  }

  async delete(id: string): Promise<void> {
    await db.viewportSnapshots.delete(id)
  }
}

export const viewportSnapshotRepository = new ViewportSnapshotRepository()
