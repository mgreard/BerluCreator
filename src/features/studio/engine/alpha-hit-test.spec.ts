import { describe, expect, it } from 'vitest'
import type { RenderableLayer } from '../composables/useHierarchyResolver'
import { mapPointToImagePixel, mapStagePointToImagePixel } from './alpha-hit-test'

function layer(overrides: Partial<RenderableLayer> = {}): RenderableLayer {
  return {
    x: 100,
    y: 200,
    width: 200,
    height: 100,
    transformOriginX: 200,
    transformOriginY: 250,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    ...overrides
  } as RenderableLayer
}

describe('mapStagePointToImagePixel', () => {
  it('mappe un point du viewport vers le pixel correspondant', () => {
    expect(mapStagePointToImagePixel(layer(), { x: 150, y: 225 }, 20, 10)).toEqual({
      x: 5,
      y: 2
    })
  })

  it('inverse la rotation et l’échelle autour du cadre logique original', () => {
    const transformed = layer({ scaleX: 2, scaleY: 2, rotation: 90 })
    expect(mapStagePointToImagePixel(transformed, { x: 200, y: 150 }, 20, 10)).toEqual({
      x: 5,
      y: 5
    })
  })

  it('inverse une rotation avec un centre distinct du pivot d’échelle', () => {
    const transformed = layer({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      transformOriginX: 50,
      transformOriginY: 100,
      rotationOriginX: 50,
      rotationOriginY: 75,
      scaleX: 0.5,
      scaleY: 0.5,
      rotation: 90
    })

    expect(mapStagePointToImagePixel(transformed, { x: 75, y: 75 }, 10, 10)).toEqual({
      x: 5,
      y: 0
    })
  })

  it('rejette un point situé hors du bitmap recadré', () => {
    expect(mapStagePointToImagePixel(layer(), { x: 99, y: 250 }, 20, 10)).toBeNull()
  })

  it('gère les objets TransformGeometry arbitraires pour le calibrateur', () => {
    const geom = {
      x: 50,
      y: 100,
      width: 100,
      height: 100,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    }
    expect(mapPointToImagePixel(geom, { x: 75, y: 125 }, 10, 10)).toEqual({
      x: 2,
      y: 2
    })
  })
})
