import { beforeEach, describe, expect, it, vi } from 'vitest'

const { deleteDatabase } = vi.hoisted(() => ({
  deleteDatabase: vi.fn()
}))

vi.mock('@infrastructure/db/dexie', () => ({
  db: { delete: deleteDatabase }
}))

import {
  APPLICATION_STORAGE_KEYS,
  resetApplicationToFactoryDefaults
} from './factory-reset.service'

describe('resetApplicationToFactoryDefaults', () => {
  beforeEach(() => {
    deleteDatabase.mockReset().mockResolvedValue(undefined)
    localStorage.clear()
  })

  it('supprime la base et uniquement les préférences appartenant à l’application', async () => {
    for (const key of APPLICATION_STORAGE_KEYS) localStorage.setItem(key, 'persisted')
    localStorage.setItem('unrelated.application.preference', 'keep-me')

    await resetApplicationToFactoryDefaults()

    expect(deleteDatabase).toHaveBeenCalledOnce()
    for (const key of APPLICATION_STORAGE_KEYS) expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem('unrelated.application.preference')).toBe('keep-me')
  })
})
