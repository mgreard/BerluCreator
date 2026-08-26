import { describe, expect, it } from 'vitest'
import { findOpaqueBounds } from './transparent-image-trimmer'

describe('findOpaqueBounds', () => {
  it('retire les lignes transparentes et conserve le padding demandé', () => {
    const pixels = new Uint8ClampedArray(6 * 5 * 4)
    pixels[(2 * 6 + 3) * 4 + 3] = 255

    expect(findOpaqueBounds(pixels, 6, 5, 1, 1)).toEqual({
      x: 2,
      y: 1,
      width: 3,
      height: 3
    })
  })

  it('ignore une image entièrement transparente', () => {
    expect(findOpaqueBounds(new Uint8ClampedArray(4 * 4 * 4), 4, 4)).toBeNull()
  })
})
