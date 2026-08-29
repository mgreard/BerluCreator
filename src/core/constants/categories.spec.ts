import { describe, expect, it } from 'vitest'
import { ASSET_CATEGORY_IDS, normalizeAssetCategory } from '../types/asset.types'
import { ASSET_CATEGORIES } from './categories'
import { resolveSpriteConfig, SPRITES_CONFIG } from './sprites-config'

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

  it('déclare les bureaux comme éléments déplaçables', () => {
    expect(resolveSpriteConfig('desk1', 'desk').isMovable).toBe(true)
    expect(SPRITES_CONFIG.categoryDefaults.desk.isMovable).toBe(true)
  })

  it('déclare lunettes et accessoires comme calques libres multi-instances', () => {
    expect(ASSET_CATEGORIES.eyes).toMatchObject({
      placementMode: 'free-transform',
      layerCardinality: 'multi'
    })
    expect(ASSET_CATEGORIES.props_host).toMatchObject({
      placementMode: 'free-transform',
      layerCardinality: 'multi'
    })
    expect(SPRITES_CONFIG.categoryDefaults.eyes.isMovable).toBe(true)
    expect(SPRITES_CONFIG.categoryDefaults.props_host.isMovable).toBe(true)
  })
})
