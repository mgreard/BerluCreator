import { db } from '../dexie'
import type { Sequence } from '@core/types/timeline.types'

export class SequenceRepository {
  async getById(id: string): Promise<Sequence | undefined> {
    return await db.sequences.get(id)
  }

  async getByProjectId(projectId: string): Promise<Sequence[]> {
    return await db.sequences.where('projectId').equals(projectId).toArray()
  }

  async save(sequence: Sequence): Promise<void> {
    await db.sequences.put({
      ...sequence,
      updatedAt: Date.now()
    })
  }

  async delete(id: string): Promise<void> {
    await db.sequences.delete(id)
  }
}

export const sequenceRepository = new SequenceRepository()
