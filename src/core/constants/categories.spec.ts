import { describe, expect, it } from 'vitest'
import { ASSET_CATEGORY_IDS, normalizeAssetCategory } from '../types/asset.types'
import { ASSET_CATEGORIES } from './categories'
import { SPRITES_CONFIG } from './sprites-config'

describe('asset categories', () => {
  it('keeps definitions and sprite defaults aligned with the canonical ids', () => {
    expect(Object.keys(ASSET_CATEGORIES)).toEqual([...ASSET_CATEGORY_IDS])
    expect(Object.keys(SPRITES_CONFIG.categoryDefaults)).toEqual([...ASSET_CATEGORY_IDS])
  })

  it('normalizes categories persisted by the previous sprite structure', () => {
    expect(normalizeAssetCategory('backdrop')).toBe('background')
    expect(normalizeAssetCategory('props')).toBe('props_host')
    expect(normalizeAssetCategory('overlay')).toBe('foreground')
    expect(normalizeAssetCategory('unknown')).toBeUndefined()
  })
})
