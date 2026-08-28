import { describe, expect, it } from 'vitest'
import { computeResizeScales, computeTransformedBounds } from './transform-matrix'

describe('computeTransformedBounds', () => {
  it('calcule les bornes exactes sans mise à l’échelle', () => {
    expect(computeTransformedBounds(100, 200, 300, 400, 1, 1)).toEqual({
      x: 100,
      y: 200,
      width: 300,
      height: 400
    })
  })

  it('calcule les bornes centrées lors d’un agrandissement', () => {
    expect(computeTransformedBounds(100, 200, 300, 400, 2, 2)).toEqual({
      x: -50,
      y: 0,
      width: 600,
      height: 800
    })
  })

  it('calcule les bornes centrées lors d’une réduction', () => {
    expect(computeTransformedBounds(100, 200, 300, 400, 0.5, 0.5)).toEqual({
      x: 175,
      y: 300,
      width: 150,
      height: 200
    })
  })

  it('utilise le centre du cadre logique pour un bitmap recadré', () => {
    expect(computeTransformedBounds(200, 250, 100, 50, 2, 2, 100, 100)).toEqual({
      x: 300,
      y: 400,
      width: 200,
      height: 100
    })
  })
})

describe('computeResizeScales', () => {
  const bounds = { x: 100, y: 100, width: 200, height: 100 }

  it('conserve le ratio avec une poignée d’angle', () => {
    const scales = computeResizeScales(
      'br',
      bounds,
      { x: 300, y: 200 },
      { x: 400, y: 250 },
      1,
      1
    )
    expect(scales.scaleX).toBeCloseTo(2)
    expect(scales.scaleY).toBeCloseTo(2)
  })

  it('conserve le ratio avec une poignée latérale horizontale', () => {
    expect(computeResizeScales(
      'right',
      bounds,
      { x: 300, y: 150 },
      { x: 400, y: 150 },
      1,
      1
    )).toEqual({ scaleX: 2, scaleY: 2 })
  })

  it('conserve le ratio avec une poignée latérale verticale', () => {
    expect(computeResizeScales(
      'bottom',
      bounds,
      { x: 200, y: 200 },
      { x: 200, y: 250 },
      1,
      1
    )).toEqual({ scaleX: 2, scaleY: 2 })
  })
})
