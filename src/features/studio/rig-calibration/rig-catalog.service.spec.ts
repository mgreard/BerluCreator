import { describe, expect, it } from 'vitest'
import type { Asset, AssetCalibration, AssetCategory } from '@core/types/asset.types'
import {
  areCalibrationsEquivalent,
  createRigDefinition,
  duplicateRigConfig,
  effectiveCalibration,
  migrateRigV2ToV3,
  parseRigCatalogFile,
  rigAssetIdentity
} from './rig-catalog.service'
import type { RigDefinition } from './rig-catalog.types'

function mockAsset(
  id: string,
  name: string,
  category: AssetCategory,
  calibration?: AssetCalibration
): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width: category === 'body' ? 800 : 260,
    height: category === 'body' ? 900 : 309,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    calibration,
    createdAt: 1,
    updatedAt: 1
  }
}

describe('rig-catalog.service', () => {
  describe('areCalibrationsEquivalent', () => {
    it('reconnaît des calibrations identiques ou dans la tolérance', () => {
      const a: AssetCalibration = { x: 10, y: 20, scaleX: 1.0001, scaleY: 1.0002, rotation: 0 }
      const b: AssetCalibration = { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 }
      expect(areCalibrationsEquivalent(a, b)).toBe(true)
    })

    it('détecte des différences significatives', () => {
      const a: AssetCalibration = { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 }
      const b: AssetCalibration = { x: 12, y: 20, scaleX: 1, scaleY: 1, rotation: 0 }
      expect(areCalibrationsEquivalent(a, b)).toBe(false)
    })
  })

  describe('effectiveCalibration', () => {
    const bodyAsset = mockAsset('body-1', 'Corps Base', 'body', {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    })
    const head1 = mockAsset('head-1', 'Tête 1', 'head', {
      x: 100,
      y: 40,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    })
    const head2 = mockAsset('head-2', 'Tête 2', 'head', {
      x: 120,
      y: 50,
      scaleX: 0.9,
      scaleY: 0.9,
      rotation: 5
    })

    const rig = createRigDefinition(bodyAsset, [bodyAsset, head1, head2])

    it('retourne la calibration du corps', () => {
      const bodyPart = { asset: rigAssetIdentity(bodyAsset) }
      expect(effectiveCalibration(rig, bodyPart)).toEqual(rig.bodyCalibration)
    })

    it('retourne null si la catégorie est désactivée', () => {
      const modifiedRig: RigDefinition = {
        ...rig,
        categories: rig.categories.map((c) => (c.category === 'head' ? { ...c, enabled: false } : c))
      }
      const part = rig.parts.find((p) => p.asset.name === 'Tête 1')!
      expect(effectiveCalibration(modifiedRig, part)).toBeNull()
    })

    it('retourne le template de la catégorie si aucune surcharge n’est définie', () => {
      const part = rig.parts.find((p) => p.asset.name === 'Tête 1')!
      expect(part.calibrationOverride).toBeUndefined()
      expect(effectiveCalibration(rig, part)).toEqual({
        x: 100,
        y: 40,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: undefined
      })
    })

    it('retourne la surcharge locale si elle est définie', () => {
      const part = rig.parts.find((p) => p.asset.name === 'Tête 2')!
      expect(part.calibrationOverride).toBeDefined()
      expect(effectiveCalibration(rig, part)).toEqual({
        x: 120,
        y: 50,
        scaleX: 0.9,
        scaleY: 0.9,
        rotation: 5,
        zIndex: undefined
      })
    })
  })

  describe('duplicateRigConfig', () => {
    it('copie les catégories, surcharges et exclusions sans modifier le corps cible', () => {
      const bodyA = mockAsset('body-a', 'Corps A', 'body')
      const bodyB = mockAsset('body-b', 'Corps B', 'body')
      const head = mockAsset('head-1', 'Tête', 'head', {
        x: 50,
        y: 25,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      })

      const rigA = createRigDefinition(bodyA, [bodyA, head])
      const rigB = createRigDefinition(bodyB, [bodyB])

      rigA.categories = rigA.categories.map((c) =>
        c.category === 'arms_left' ? { ...c, enabled: false } : c
      )
      rigA.excludedPartKeys = ['arms_right:main_droite:100x100']

      const duplicated = duplicateRigConfig(rigA, rigB)

      expect(duplicated.id).toBe(rigB.id)
      expect(duplicated.body).toEqual(rigB.body)
      expect(duplicated.bodyCalibration).toEqual(rigB.bodyCalibration)
      expect(duplicated.categories.find((c) => c.category === 'arms_left')?.enabled).toBe(false)
      expect(duplicated.excludedPartKeys).toEqual(['arms_right:main_droite:100x100'])
      expect(duplicated.parts).toHaveLength(rigA.parts.length)

      // Isolation mémoire
      duplicated.categories[0].enabled = false
      expect(rigA.categories[0].enabled).toBe(true)
    })
  })

  describe('Migration v2 vers v3', () => {
    it('convertit correctement un rig v2 en v3 sans perte de calibration', () => {
      const v2Rig = {
        id: 'rig-berlu-buste',
        name: 'Buste',
        characterKey: 'berlu',
        characterName: 'Berlu',
        canvasWidth: 840,
        canvasHeight: 908,
        body: { name: 'Buste', category: 'body', width: 424, height: 838 },
        parts: [
          {
            asset: { name: 'Buste', category: 'body', width: 424, height: 838 },
            calibration: { x: 0, y: 10, scaleX: 1, scaleY: 1, rotation: 0 },
            isDefault: true
          },
          {
            asset: { name: 'Tête Normale', category: 'head', width: 260, height: 309 },
            calibration: { x: 100, y: 40, scaleX: 1, scaleY: 1, rotation: 0 },
            isDefault: true
          },
          {
            asset: { name: 'Tête Géante', category: 'head', width: 300, height: 350 },
            calibration: { x: 95, y: 35, scaleX: 1.2, scaleY: 1.2, rotation: 0 },
            isDefault: false
          }
        ],
        excludedPartKeys: ['head:exclue:100x100'],
        updatedAt: 123456
      }

      const migrated = migrateRigV2ToV3(v2Rig)
      expect(migrated).not.toBeNull()
      if (!migrated) return

      expect(migrated.bodyCalibration).toEqual({ x: 0, y: 10, scaleX: 1, scaleY: 1, rotation: 0 })
      expect(migrated.parts.some((p) => p.asset.category === 'body')).toBe(false)

      const headCategory = migrated.categories.find((c) => c.category === 'head')
      expect(headCategory?.enabled).toBe(true)
      expect(headCategory?.template).toEqual({ x: 100, y: 40, scaleX: 1, scaleY: 1, rotation: 0 })
      expect(headCategory?.defaultPartKey).toBe('head:tête normale:260x309')

      const normalHead = migrated.parts.find((p) => p.asset.name === 'Tête Normale')
      expect(normalHead?.calibrationOverride).toBeUndefined()

      const giantHead = migrated.parts.find((p) => p.asset.name === 'Tête Géante')
      expect(giantHead?.calibrationOverride).toEqual({
        x: 95,
        y: 35,
        scaleX: 1.2,
        scaleY: 1.2,
        rotation: 0
      })
      expect(migrated.excludedPartKeys).toEqual(['head:exclue:100x100'])
    })

    it('parseRigCatalogFile migre un fichier v2 et génère un catalogue v3', () => {
      const v2File = {
        schema: 'berlu-creator/rig-catalog',
        version: 2,
        exportedAt: '2026-08-28T00:00:00.000Z',
        defaultRigByCharacter: { berlu: 'rig-berlu-buste' },
        rigs: [
          {
            id: 'rig-berlu-buste',
            name: 'Buste',
            characterKey: 'berlu',
            characterName: 'Berlu',
            canvasWidth: 840,
            canvasHeight: 908,
            body: { name: 'Buste', category: 'body', width: 424, height: 838 },
            parts: [
              {
                asset: { name: 'Buste', category: 'body', width: 424, height: 838 },
                calibration: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
                isDefault: true
              }
            ],
            excludedPartKeys: [],
            updatedAt: 1
          }
        ]
      }

      const result = parseRigCatalogFile(JSON.stringify(v2File))
      expect(result.version).toBe(3)
      expect(result.rigs).toHaveLength(1)
      expect(result.rigs[0].bodyCalibration).toBeDefined()
    })
  })
})
