import { describe, it, expect } from 'vitest'
import { computeResizeScales, computeTransformedBounds } from './transform-matrix'

describe('computeTransformedBounds', () => {
  it('calcule les bornes exactes sans mise à l’échelle (scale = 1)', () => {
    const bounds = computeTransformedBounds(100, 200, 300, 400, 1, 1)
    expect(bounds).toEqual({
      x: 100,
      y: 200,
      width: 300,
      height: 400
    })
  })

  it('calcule les bornes centrées lors d’un agrandissement (scale = 2)', () => {
    const bounds = computeTransformedBounds(100, 200, 300, 400, 2, 2)
    expect(bounds).toEqual({
      x: -50,
      y: 0,
      width: 600,
      height: 800
    })
  })

  it('calcule les bornes centrées lors d’une réduction (scale = 0.5)', () => {
    const bounds = computeTransformedBounds(100, 200, 300, 400, 0.5, 0.5)
    expect(bounds).toEqual({
      x: 175,
      y: 300,
      width: 150,
      height: 200
    })
  })
})

describe('computeResizeScales', () => {
  const bounds = { x: 100, y: 100, width: 200, height: 100 }

  it('conserve le ratio existant avec une poignée d’angle', () => {
    const scales = computeResizeScales(
      'br',
      bounds,
      { x: 300, y: 200 },
      { x: 400, y: 250 },
      1,
      0.5
    )

    expect(scales.scaleX).toBeCloseTo(2)
    expect(scales.scaleY).toBeCloseTo(1)
  })

  it('ne modifie que scaleX avec une poignée latérale horizontale', () => {
    expect(
      computeResizeScales(
        'right',
        bounds,
        { x: 300, y: 150 },
        { x: 400, y: 150 },
        1,
        0.75
      )
    ).toEqual({ scaleX: 2, scaleY: 0.75 })
  })

  it('ne modifie que scaleY avec une poignée latérale verticale', () => {
    expect(
      computeResizeScales(
        'bottom',
        bounds,
        { x: 200, y: 200 },
        { x: 200, y: 250 },
        1.25,
        1
      )
    ).toEqual({ scaleX: 1.25, scaleY: 2 })
  })
})
