import { describe, expect, it } from 'vitest'
import type { Asset, AssetCalibration, AssetCategory } from '@core/types/asset.types'
import {
  areCalibrationsEquivalent,
  createRigDefinition,
  duplicateRigConfig,
  effectiveCalibration,
  headCalibrationToAbsolute,
  parseRigCatalogFile,
  rebaseRigBodyOrigin,
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

describe('rig-catalog.service (v6)', () => {
  it('exclut les accessoires libres de la définition des rigs', () => {
    const body = mockAsset('body', 'Corps', 'body')
    const glasses = mockAsset('glasses', 'Lunettes', 'eyes')
    const hat = mockAsset('hat', 'Chapeau', 'props_host')
    const rig = createRigDefinition(body, [body, glasses, hat])

    expect(rig.categories.map((category) => category.category)).not.toContain('eyes')
    expect(rig.categories.map((category) => category.category)).not.toContain('props_host')
    expect(rig.parts).toHaveLength(0)
  })

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

    it('retourne le template relatif de la catégorie si aucune surcharge n’est définie', () => {
      const part = rig.parts.find((p) => p.asset.name === 'Tête 1')!
      expect(part.calibrationOverride).toBeUndefined()
      const relative = effectiveCalibration(rig, part)
      expect(relative).toEqual({
        x: -300,
        y: -410,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: undefined
      })
      expect(headCalibrationToAbsolute(rig, relative!)).toEqual({
        x: 100,
        y: 40,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        zIndex: undefined
      })
    })

    it('retourne la surcharge locale relative si elle est définie', () => {
      const part = rig.parts.find((p) => p.asset.name === 'Tête 2')!
      expect(part.calibrationOverride).toBeDefined()
      const relative = effectiveCalibration(rig, part)
      expect(relative).toEqual({
        x: -280,
        y: -400,
        scaleX: 0.9,
        scaleY: 0.9,
        rotation: 5,
        zIndex: undefined
      })
      expect(headCalibrationToAbsolute(rig, relative!)).toEqual({
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
        c.category === 'head' ? { ...c, enabled: false } : c
      )
      rigA.excludedPartKeys = ['head:exclue:100x100']

      const duplicated = duplicateRigConfig(rigA, rigB)

      expect(duplicated.id).toBe(rigB.id)
      expect(duplicated.body).toEqual(rigB.body)
      expect(duplicated.bodyCalibration).toEqual(rigB.bodyCalibration)
      expect(duplicated.categories.find((c) => c.category === 'head')?.enabled).toBe(false)
      expect(duplicated.excludedPartKeys).toEqual(['head:exclue:100x100'])
      expect(duplicated.parts).toHaveLength(rigA.parts.length)

      // Isolation mémoire
      duplicated.categories[0].enabled = true
      expect(rigA.categories[0].enabled).toBe(false)
    })
  })

  describe('Géométrie v6 et invariance visuelle', () => {
    it('rebaseRigBodyOrigin conserve la position visuelle absolue des têtes', () => {
      const bodyAsset = mockAsset('body-1', 'Corps Base', 'body', {
        x: 10,
        y: 20,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      })
      const headAsset = mockAsset('head-1', 'Tête 1', 'head', {
        x: 100,
        y: 40,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      })

      const rig = createRigDefinition(bodyAsset, [bodyAsset, headAsset])
      const initialOrigin = { ...rig.bodyOrigin }
      expect(initialOrigin).toEqual({ x: 400, y: 450 })

      // Modifier l'origine
      const newOrigin = { x: 350, y: 400 }
      const rebased = rebaseRigBodyOrigin(rig, newOrigin)

      expect(rebased.bodyOrigin).toEqual(newOrigin)

      // Vérifier que la position absolue de la tête est identique avant et après
      const initialAbs = headCalibrationToAbsolute(rig, rig.categories.find((c) => c.category === 'head')!.template!)
      const rebasedAbs = headCalibrationToAbsolute(rebased, rebased.categories.find((c) => c.category === 'head')!.template!)

      expect(rebasedAbs.x).toBeCloseTo(initialAbs.x, 3)
      expect(rebasedAbs.y).toBeCloseTo(initialAbs.y, 3)
    })

    it('parseRigCatalogFile parse un fichier v6', () => {
      const v6File = {
        schema: 'berlu-creator/rig-catalog',
        version: 6,
        exportedAt: '2026-08-29T00:00:00.000Z',
        defaultRigByCharacter: { berlu: 'rig-v6' },
        rigs: [
          {
            id: 'rig-v6',
            name: 'Rig v6',
            characterKey: 'berlu',
            characterName: 'Berlu',
            canvasWidth: 840,
            canvasHeight: 908,
            body: { name: 'Corps', category: 'body', width: 800, height: 900 },
            bodyCalibration: { x: 10, y: 20, scaleX: 1, scaleY: 1, rotation: 0 },
            bodyOrigin: { x: 400, y: 450 },
            categories: [
              {
                category: 'head',
                enabled: true,
                template: { x: 100, y: 40, scaleX: 1, scaleY: 1, rotation: 0 }
              }
            ],
            parts: [
              {
                asset: { name: 'Tête 1', category: 'head', width: 260, height: 309 }
              }
            ],
            excludedPartKeys: [],
            updatedAt: 1
          }
        ]
      }

      const parsed = parseRigCatalogFile(JSON.stringify(v6File))
      expect(parsed.version).toBe(6)
      expect(parsed.rigs).toHaveLength(1)
      expect(parsed.rigs[0].bodyCalibration).toBeDefined()
    })
  })
})
