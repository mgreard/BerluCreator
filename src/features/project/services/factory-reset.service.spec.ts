import { beforeEach, describe, expect, it, vi } from 'vitest'

const { clearTable } = vi.hoisted(() => ({
  clearTable: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@infrastructure/db/dexie', () => ({
  db: {
    isOpen: vi.fn().mockReturnValue(true),
    open: vi.fn().mockResolvedValue(undefined),
    tables: [{ clear: clearTable }]
  }
}))

import {
  APPLICATION_STORAGE_KEYS,
  LEGACY_RIG_CATALOG_STORAGE_KEYS,
  removeLegacyRigCatalogs,
  resetApplicationToFactoryDefaults
} from './factory-reset.service'

describe('resetApplicationToFactoryDefaults', () => {
  beforeEach(() => {
    clearTable.mockReset().mockResolvedValue(undefined)
    localStorage.clear()
  })

  it('supprime la base et uniquement les préférences appartenant à l’application', async () => {
    for (const key of APPLICATION_STORAGE_KEYS) localStorage.setItem(key, 'persisted')
    localStorage.setItem('unrelated.application.preference', 'keep-me')

    await resetApplicationToFactoryDefaults()

    expect(clearTable).toHaveBeenCalledOnce()
    for (const key of APPLICATION_STORAGE_KEYS) expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem('unrelated.application.preference')).toBe('keep-me')
  })

  it('retire explicitement les anciens catalogues de rigs', () => {
    for (const key of LEGACY_RIG_CATALOG_STORAGE_KEYS) localStorage.setItem(key, 'legacy')
    localStorage.setItem('berlu-creator:rig-catalog:v7', 'current')

    removeLegacyRigCatalogs()

    for (const key of LEGACY_RIG_CATALOG_STORAGE_KEYS) expect(localStorage.getItem(key)).toBeNull()
    expect(localStorage.getItem('berlu-creator:rig-catalog:v7')).toBe('current')
  })
})
