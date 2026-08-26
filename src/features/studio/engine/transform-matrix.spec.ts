import { describe, it, expect } from 'vitest'
import { computeTransformedBounds } from './transform-matrix'

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
