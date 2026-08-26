import { db } from '../dexie'
import type { Sequence } from '@core/types/timeline.types'

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export class SequenceRepository {
  async getById(id: string): Promise<Sequence | undefined> {
    return await db.sequences.get(id)
  }

  async save(sequence: Sequence): Promise<void> {
    await db.sequences.put({
      ...toPlain(sequence),
      updatedAt: Date.now()
    })
  }

}

export const sequenceRepository = new SequenceRepository()
