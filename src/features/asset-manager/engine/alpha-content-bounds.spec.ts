import { describe, expect, it } from 'vitest'
import { findAlphaContentBounds } from './alpha-content-bounds'

function rgba(width: number, height: number, opaquePixels: Array<[number, number, number?]>) {
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (const [x, y, alpha = 255] of opaquePixels) {
    pixels[(y * width + x) * 4 + 3] = alpha
  }
  return pixels
}

describe('findAlphaContentBounds', () => {
  it('recadre le contenu opaque en ignorant les marges transparentes', () => {
    const pixels: Array<[number, number]> = []
    for (let y = 3; y <= 6; y += 1) {
      for (let x = 2; x <= 7; x += 1) pixels.push([x, y])
    }

    expect(findAlphaContentBounds(rgba(10, 10, pixels), 10, 10)).toEqual({
      x: 2,
      y: 3,
      width: 6,
      height: 4
    })
  })

  it('ignore les pixels isolés autour d’un contenu principal', () => {
    const pixels: Array<[number, number]> = [[0, 0], [19, 19]]
    for (let y = 6; y <= 13; y += 1) {
      for (let x = 5; x <= 14; x += 1) pixels.push([x, y])
    }

    expect(
      findAlphaContentBounds(rgba(20, 20, pixels), 20, 20, { outlierFraction: 0.02 })
    ).toEqual({ x: 5, y: 6, width: 10, height: 8 })
  })

  it('conserve plusieurs zones opaques significatives séparées', () => {
    const pixels: Array<[number, number]> = []
    for (let y = 4; y <= 7; y += 1) {
      for (let x = 2; x <= 4; x += 1) pixels.push([x, y])
      for (let x = 11; x <= 13; x += 1) pixels.push([x, y])
    }

    expect(findAlphaContentBounds(rgba(16, 12, pixels), 16, 12)).toEqual({
      x: 2,
      y: 4,
      width: 12,
      height: 4
    })
  })

  it('conserve un asset minuscule lorsqu’il constitue tout le contenu', () => {
    expect(findAlphaContentBounds(rgba(100, 100, [[50, 50]]), 100, 100)).toEqual({
      x: 50,
      y: 50,
      width: 1,
      height: 1
    })
  })

  it('ignore les pixels sous le seuil alpha et gère une image vide', () => {
    expect(findAlphaContentBounds(rgba(4, 4, [[1, 1, 7]]), 4, 4)).toBeNull()
    expect(findAlphaContentBounds(new Uint8ClampedArray(4 * 4 * 4), 4, 4)).toBeNull()
  })
})
