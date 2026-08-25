import { db } from '../dexie'
import type { CharacterPreset } from '@core/types/character.types'

export class CharacterRepository {
  async getAll(): Promise<CharacterPreset[]> {
    return await db.characters.toArray()
  }

  async getById(id: string): Promise<CharacterPreset | undefined> {
    return await db.characters.get(id)
  }

  async save(preset: CharacterPreset): Promise<void> {
    await db.characters.put({
      ...preset,
      updatedAt: Date.now()
    })
  }

  async delete(id: string): Promise<void> {
    await db.characters.delete(id)
  }
}

export const characterRepository = new CharacterRepository()
