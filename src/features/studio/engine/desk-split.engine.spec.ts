import { describe, expect, it } from 'vitest'
import {
  buildSplitPolygons,
  interpolateSpline,
  isSplitConfigValid
} from './desk-split.engine'
import type { DeskSplitConfig } from '@core/types/asset.types'

describe('desk-split.engine', () => {
  describe('isSplitConfigValid', () => {
    it('retourne false si config est nulle ou non activée', () => {
      expect(isSplitConfigValid(null)).toBe(false)
      expect(isSplitConfigValid(undefined)).toBe(false)
      expect(isSplitConfigValid({ enabled: false, cutline: [{ x: 0, y: 0.5 }, { x: 1, y: 0.5 }] })).toBe(false)
    })

    it('retourne false si la cutline a moins de 2 points', () => {
      expect(isSplitConfigValid({ enabled: true, cutline: [{ x: 0.5, y: 0.5 }] })).toBe(false)
    })

    it('retourne true pour une cutline valide de 2 points ou plus', () => {
      const config: DeskSplitConfig = {
        enabled: true,
        cutline: [
          { x: 0, y: 0.4 },
          { x: 0.5, y: 0.6 },
          { x: 1, y: 0.4 }
        ]
      }
      expect(isSplitConfigValid(config)).toBe(true)
    })
  })

  describe('buildSplitPolygons', () => {
    it('génère des polygones fermés haut et bas à partir d’une ligne horizontale', () => {
      const cutline = [
        { x: 0, y: 0.5 },
        { x: 1, y: 0.5 }
      ]
      const { backPolygon, frontPolygon, cutPixels } = buildSplitPolygons(cutline, 1000, 500)

      expect(cutPixels).toEqual([
        { x: 0, y: 250 },
        { x: 1000, y: 250 }
      ])

      // Polygone Arrière / Haut (fermé sur le haut)
      expect(backPolygon).toEqual([
        { x: 0, y: 0 },
        { x: 0, y: 250 },
        { x: 1000, y: 250 },
        { x: 1000, y: 0 }
      ])

      // Polygone Avant / Bas (fermé sur le bas)
      expect(frontPolygon).toEqual([
        { x: 0, y: 500 },
        { x: 0, y: 250 },
        { x: 1000, y: 250 },
        { x: 1000, y: 500 }
      ])
    })

    it('étend automatiquement les points aux bordures x=0 et x=1 si manquants', () => {
      const cutline = [
        { x: 0.2, y: 0.4 },
        { x: 0.8, y: 0.6 }
      ]
      const { cutPixels } = buildSplitPolygons(cutline, 100, 100)

      expect(cutPixels[0]).toEqual({ x: 0, y: 40 })
      expect(cutPixels[1]).toEqual({ x: 20, y: 40 })
      expect(cutPixels[2]).toEqual({ x: 80, y: 60 })
      expect(cutPixels[3]).toEqual({ x: 100, y: 60 })
    })

    it('gère une cutline vide en générant une ligne médiane par défaut', () => {
      const { backPolygon, frontPolygon } = buildSplitPolygons([], 200, 100)
      expect(backPolygon.length).toBeGreaterThanOrEqual(4)
      expect(frontPolygon.length).toBeGreaterThanOrEqual(4)
    })
  })

  describe('interpolateSpline', () => {
    it('retourne les points inchangés si moins de 3 points', () => {
      const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }]
      expect(interpolateSpline(pts)).toEqual(pts)
    })

    it('génère une série dense et continue de points interpolés', () => {
      const pts = [
        { x: 0, y: 100 },
        { x: 50, y: 150 },
        { x: 100, y: 100 }
      ]
      const interpolated = interpolateSpline(pts, 0.5, 4)
      expect(interpolated.length).toBeGreaterThan(pts.length)
      expect(interpolated[0]).toEqual({ x: 0, y: 100 })
      expect(interpolated[interpolated.length - 1]).toEqual({ x: 100, y: 100 })
    })
  })
})
