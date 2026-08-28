import { describe, expect, it } from 'vitest'
import type { Asset } from '@core/types/asset.types'
import {
  migrateV4Asset,
  migrateV4Document,
  type V4Asset,
  type V4Document
} from './dexie'

const now = 1_700_000_000_000

function legacyAsset(overrides: Partial<V4Asset>): V4Asset {
  return {
    id: 'asset_body',
    name: 'Corps Berlu',
    category: 'torso',
    tags: ['torso', 'Berlu'],
    blobId: 'blob_body',
    width: 840,
    height: 908,
    isMovable: false,
    createdAt: now,
    updatedAt: now,
    ...overrides
  }
}

function legacyDocument(): V4Document {
  return {
    id: 'doc_default',
    projectId: 'proj_default',
    name: 'Studio',
    camera: {
      enabled: true,
      x: 12,
      y: 24,
      width: 1280,
      height: 720,
      aspectRatio: '16:9'
    },
    character: {
      x: 45,
      y: -10,
      scaleX: 1.2,
      scaleY: 1.2,
      rotation: 4,
      visible: true,
      zIndex: 28
    },
    groups: [{
      id: 'grp_berlu',
      name: 'Berlu',
      zIndex: 20,
      allowedCategories: ['torso', 'head'],
      isDefault: true
    }],
    layers: [
      {
        id: 'layer_full',
        assetId: 'asset_full',
        name: 'Berlu complet',
        category: 'torso',
        groupId: 'grp_berlu',
        zIndex: 20,
        order: 0,
        muted: false,
        localX: 3,
        localY: 4,
        scaleX: 0.9,
        scaleY: 0.9,
        rotation: 2
      },
      {
        id: 'layer_head',
        assetId: 'asset_head',
        name: 'Tête',
        category: 'head',
        groupId: 'grp_berlu',
        zIndex: 21,
        order: 1,
        muted: true
      }
    ],
    createdAt: now,
    updatedAt: now
  }
}

describe('migration Dexie v4 vers v5', () => {
  it('convertit explicitement les sprites complets sans conserver les dimensions legacy', () => {
    const migrated = migrateV4Asset(legacyAsset({
      id: 'asset_full',
      name: 'Berlu complet',
      tags: ['torso', 'full', 'Berlu'],
      displayWidth: 420,
      displayHeight: 454,
      trimFrame: { x: 1 }
    }))

    expect(migrated.category).toBe('character_full')
    expect(migrated.character).toEqual({ key: 'berlu', name: 'Berlu', form: 'full' })
    expect(migrated).not.toHaveProperty('displayWidth')
    expect(migrated).not.toHaveProperty('displayHeight')
    expect(migrated).not.toHaveProperty('trimFrame')
  })

  it('préserve simultanément le sprite complet, le rig et le transform global', () => {
    const full = migrateV4Asset(legacyAsset({
      id: 'asset_full',
      name: 'Berlu complet',
      tags: ['full', 'Berlu']
    }))
    const head = migrateV4Asset(legacyAsset({
      id: 'asset_head',
      name: 'Tête Berlu',
      category: 'head',
      tags: ['head', 'Berlu'],
      blobId: 'blob_head'
    }))
    const assets = new Map<string, Asset>([[full.id, full], [head.id, head]])

    const migrated = migrateV4Document(legacyDocument(), assets)
    const berlu = migrated.groups.find((group) => group.id === 'grp_berlu')

    expect(berlu).toMatchObject({
      kind: 'character',
      characterKey: 'berlu',
      activeMode: 'full',
      zIndex: 28,
      transform: { x: 45, y: -10, scaleX: 1.2, scaleY: 1.2, rotation: 4 }
    })
    expect(migrated.layers.map((layer) => layer.category)).toEqual(['character_full', 'head'])
    expect(migrated.layers[0].transform).toMatchObject({
      x: 3,
      y: 4,
      scaleX: 0.9,
      scaleY: 0.9,
      rotation: 2
    })
    expect(migrated).not.toHaveProperty('character')
  })
})
