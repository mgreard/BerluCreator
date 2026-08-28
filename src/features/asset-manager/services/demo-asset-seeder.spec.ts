import { describe, expect, it } from 'vitest'
import type { Asset } from '@core/types/asset.types'
import {
  findMissingBundledSpritePaths,
  parseSpriteMetadata
} from './demo-asset-seeder'

const bundledSpritePaths = Object.keys(
  import.meta.glob('@/assets/sprites/**/*.png')
)

describe('default sprite metadata', () => {
  it.each([
    ['background/background1.png', 'background'],
    ['torso/Torse.png', 'body'],
    ['head/smile_head.png', 'head'],
    ['mouth/mouth_smile1.png', 'mouth'],
    ['eyes/hearts_eyes.png', 'eyes'],
    ['props-host/party_hat.png', 'props_host'],
    ['props-set/Item_stop.png', 'props_set'],
    ['desk/Desk_tiki.png', 'desk'],
    ['props-desk/Item_vote.png', 'props_desk'],
    ['foreground/pollution_foreground.png', 'foreground']
  ] as const)('maps %s to %s', (path, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`).category).toBe(expectedCategory)
  })

  it.each([
    ['head/Head_enthousiaste.png', 'head'],
    ['head/Head_gené.png', 'head'],
    ['torso/Torse_tropi_thumbup.png', 'body'],
    ['desk/Desk_pool.png', 'desk'],
    ['foreground/Plante_6_foreground.png', 'foreground'],
    ['props-set/Flamingo_propset.png', 'props_set']
  ] as const)('maps the new sprite %s to %s', (path, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`).category).toBe(expectedCategory)
  })

  it('classifies every bundled PNG', () => {
    expect(bundledSpritePaths).toHaveLength(105)
    for (const path of bundledSpritePaths) {
      expect(() => parseSpriteMetadata(path)).not.toThrow()
    }
  })

  it('keeps an existing asset and only returns missing bundled sprites', () => {
    const existing = [
      { name: 'Head amuse', category: 'head' },
      { name: 'Desk tiki', category: 'desk' }
    ] satisfies Array<Pick<Asset, 'name' | 'category'>>

    expect(findMissingBundledSpritePaths([
      '/src/assets/sprites/head/Head_amuse.png',
      '/src/assets/sprites/head/Head_rire.png',
      '/src/assets/sprites/desk/Desk_tiki.png'
    ], existing)).toEqual(['/src/assets/sprites/head/Head_rire.png'])
  })

  it.each([
    ['default_left_arm.png', 'arms_left'],
    ['open_right_arm.png', 'arms_right'],
    ['cross_both_arms.png', 'arms_right']
  ] as const)('maps the renamed arm %s to %s', (fileName, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/arms/${fileName}`).category).toBe(
      expectedCategory
    )
  })

  it('rejects a folder that is not part of the default sprite structure', () => {
    expect(() =>
      parseSpriteMetadata('/src/assets/sprites/legacy/item.png')
    ).toThrow('Dossier de sprites non reconnu')
  })
})
