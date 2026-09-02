import { describe, expect, it } from 'vitest'
import { ASSET_CATEGORY_IDS, normalizeAssetCategory } from '../types/asset.types'
import { ASSET_CATEGORIES } from './categories'
import { resolveSpriteConfig, SPRITES_CONFIG } from './sprites-config'

describe('asset categories v6', () => {
  it('keeps definitions and sprite defaults aligned with the canonical ids', () => {
    expect(Object.keys(ASSET_CATEGORIES)).toEqual([...ASSET_CATEGORY_IDS])
    expect(Object.keys(SPRITES_CONFIG.categoryDefaults)).toEqual([...ASSET_CATEGORY_IDS])
  })

  it('normalizes the supported legacy import aliases', () => {
    expect(normalizeAssetCategory('backdrop')).toBe('background')
    expect(normalizeAssetCategory('character_full')).toBe('perso')
    expect(normalizeAssetCategory('props')).toBe('props_character')
    expect(normalizeAssetCategory('torso')).toBe('body')
    expect(normalizeAssetCategory('unknown')).toBeUndefined()
  })

  it('defines the new overlay and character slots', () => {
    expect(ASSET_CATEGORIES.background_overlay).toMatchObject({
      layerCardinality: 'singleton',
      placementMode: 'free-transform'
    })
    expect(ASSET_CATEGORIES.props_character).toMatchObject({
      placementMode: 'character-anchored',
      layerCardinality: 'multi'
    })
    expect(resolveSpriteConfig('desk1', 'desk').isMovable).toBe(true)
    expect(SPRITES_CONFIG.categoryDefaults.props_character.isMovable).toBe(false)
  })
})
