import { describe, expect, it } from 'vitest'
import type { Asset } from '@core/types/asset.types'
import { findMissingBundledSpritePaths, parseSpriteMetadata } from './demo-asset-seeder'

const bundledSpritePaths = Object.keys(import.meta.glob('@/assets/sprites/**/*.png'))

describe('default sprite metadata', () => {
  it.each([
    ['background/background1.png', 'background'],
    ['torso/Torse.png', 'body'],
    ['head/smile_head.png', 'head'],
    ['eyes/hearts_eyes.png', 'eyes'],
    ['props-host/party_hat.png', 'props_host'],
    ['props-set/Item_stop.png', 'props_set'],
    ['desk/Desk_tiki.png', 'desk'],
    ['props-desk/Item_vote.png', 'props_desk'],
    ['foreground/pollution_foreground.png', 'foreground']
  ] as const)('maps %s to %s', (path, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`)?.category).toBe(expectedCategory)
  })

  it.each([
    ['head/Head_enthousiaste.png', 'head'],
    ['head/Head_gené.png', 'head'],
    ['torso/Torse_tropi_thumbup.png', 'body'],
    ['desk/Desk_pool.png', 'desk'],
    ['foreground/Plante_6_foreground.png', 'foreground'],
    ['props-set/Flamingo_propset.png', 'props_set']
  ] as const)('maps the new sprite %s to %s', (path, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`)?.category).toBe(expectedCategory)
  })

  it('classifies or safely skips every bundled PNG', () => {
    expect(bundledSpritePaths.length).toBeGreaterThan(0)
    for (const path of bundledSpritePaths) {
      expect(() => parseSpriteMetadata(path)).not.toThrow()
    }
  })

  it('ignores obsolete arms and mouth sprites', () => {
    expect(parseSpriteMetadata('/src/assets/sprites/mouth/mouth_smile.png')).toBeNull()
    expect(parseSpriteMetadata('/src/assets/sprites/arms/left_arm.png')).toBeNull()
  })

  it('keeps an existing asset and only returns missing bundled sprites', () => {
    const existing = [
      { name: 'Head amuse', category: 'head' },
      { name: 'Desk tiki', category: 'desk' }
    ] satisfies Array<Pick<Asset, 'name' | 'category'>>

    expect(
      findMissingBundledSpritePaths(
        [
          '/src/assets/sprites/head/Head_amuse.png',
          '/src/assets/sprites/head/Head_rire.png',
          '/src/assets/sprites/desk/Desk_tiki.png'
        ],
        existing
      )
    ).toEqual(['/src/assets/sprites/head/Head_rire.png'])
  })

  it('returns null for a folder that is not part of the default sprite structure', () => {
    expect(parseSpriteMetadata('/src/assets/sprites/legacy/item.png')).toBeNull()
  })

  it('supprime les doublons et les catégories invalides lors du nettoyage', async () => {
    const { cleanupObsoleteAndDuplicateAssets } = await import('./demo-asset-seeder')
    const { assetRepository } = await import('@infrastructure/db/repositories/asset.repository')

    const mockAssets: Asset[] = [
      {
        id: 'asset-1',
        name: 'Glaciere propset',
        category: 'props_set',
        tags: [],
        blobId: 'blob-1',
        width: 100,
        height: 100,
        isMovable: true,
        createdAt: 1,
        updatedAt: 1
      },
      {
        id: 'asset-2',
        name: 'Glaciere propset', // Doublon exact
        category: 'props_set',
        tags: [],
        blobId: 'blob-2',
        width: 100,
        height: 100,
        isMovable: true,
        createdAt: 2,
        updatedAt: 2
      },
      {
        id: 'asset-3',
        name: 'Bouche',
        category: 'mouth' as Asset['category'], // Catégorie obsolète
        tags: [],
        blobId: 'blob-3',
        width: 100,
        height: 100,
        isMovable: true,
        createdAt: 3,
        updatedAt: 3
      }
    ]

    const deletedIds: string[] = []
    assetRepository.getAll = async () => mockAssets
    assetRepository.delete = async (id: string) => {
      deletedIds.push(id)
    }

    await cleanupObsoleteAndDuplicateAssets()
    expect(deletedIds).toContain('asset-2') // Le doublon a été supprimé
    expect(deletedIds).toContain('asset-3') // La catégorie obsolète a été supprimée
    expect(deletedIds).not.toContain('asset-1') // L'original est conservé
  })
})
