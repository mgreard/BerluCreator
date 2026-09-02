import { describe, expect, it } from 'vitest'
import type { Asset } from '@core/types/asset.types'
import { findMissingBundledSpritePaths, parseSpriteMetadata } from './demo-asset-seeder'

const bundledSpritePaths = Object.keys(
  import.meta.glob('@/assets/sprites/**/*.{png,jpg,jpeg,webp,svg}')
)

describe('bundled sprite metadata v6', () => {
  it.each([
    ['background/background1.png', 'background'],
    ['background_overlay/halo.webp', 'background_overlay'],
    ['body/Body1.png', 'body'],
    ['head/berlu/Neutre_head.png', 'head'],
    ['mouth/berlu/smile.svg', 'mouth'],
    ['props_character/sunglass/classic.png', 'props_character'],
    ['props_character/hat/party.png', 'props_character'],
    ['props_set/Item_stop.jpg', 'props_set'],
    ['desk/Desk_tiki.jpeg', 'desk'],
    ['props_desk/Item_vote.png', 'props_desk'],
    ['foreground/pollution_foreground.png', 'foreground']
  ] as const)('maps %s to %s', (path, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`)?.category).toBe(expectedCategory)
  })

  it('extracts series and global prop slots from nested folders', () => {
    expect(parseSpriteMetadata('/src/assets/sprites/head/berlu/Neutre_head.png')).toMatchObject({
      headSeriesId: 'berlu',
      sourcePath: 'head/berlu/Neutre_head.png'
    })
    expect(parseSpriteMetadata('/src/assets/sprites/mouth/pedro/smile.svg')).toMatchObject({
      headSeriesId: 'pedro'
    })
    expect(parseSpriteMetadata('/src/assets/sprites/props_character/hat/party.webp')).toMatchObject({
      characterPropSlot: 'hat'
    })
  })

  it.each([
    ['perso/Berleak1.png', 'berleak'],
    ['perso/pedro1_1.png', 'pedro-1'],
    ['perso/pedro2_1.png', 'pedro-2'],
    ['perso/moman_decontract.png', 'moman']
  ] as const)('groups %s in the %s family', (path, family) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`)?.character?.key).toBe(family)
  })

  it('classifies every bundled supported image', () => {
    expect(bundledSpritePaths).toHaveLength(83)
    for (const path of bundledSpritePaths) expect(parseSpriteMetadata(path)).not.toBeNull()
  })

  it('reconciles bundled assets by source path and preserves uploaded identities', () => {
    const existing = [
      { name: 'Neutre head', category: 'head', sourcePath: 'head/berlu/Neutre_head.png' },
      { name: 'Custom', category: 'head' }
    ] satisfies Array<Pick<Asset, 'name' | 'category' | 'sourcePath'>>

    expect(
      findMissingBundledSpritePaths(
        [
          '/src/assets/sprites/head/berlu/Neutre_head.png',
          '/src/assets/sprites/head/berlu/Peur_head.png'
        ],
        existing
      )
    ).toEqual(['/src/assets/sprites/head/berlu/Peur_head.png'])
  })

  it('rejects unknown roots and unsupported prop slots', () => {
    expect(parseSpriteMetadata('/src/assets/sprites/legacy/item.png')).toBeNull()
    expect(parseSpriteMetadata('/src/assets/sprites/props_character/crown/item.png')).toBeNull()
  })
})
