import { describe, expect, it } from 'vitest'
import { findOpaqueBounds } from './transparent-image-trimmer'

describe('transparent-image-trimmer', () => {
  describe('findOpaqueBounds', () => {
    it('returns null for fully transparent image', () => {
      const width = 4
      const height = 4
      const pixels = new Uint8ClampedArray(width * height * 4) // All zeros
      const bounds = findOpaqueBounds(pixels, width, height)
      expect(bounds).toBeNull()
    })

    it('returns exact bounding box for a centered 2x2 opaque square in a 4x4 image', () => {
      const width = 4
      const height = 4
      const pixels = new Uint8ClampedArray(width * height * 4)

      // Set pixels at (1,1), (2,1), (1,2), (2,2) with alpha = 255
      for (const y of [1, 2]) {
        for (const x of [1, 2]) {
          const index = (y * width + x) * 4
          pixels[index + 0] = 255 // R
          pixels[index + 1] = 0 // G
          pixels[index + 2] = 0 // B
          pixels[index + 3] = 255 // A
        }
      }

      const bounds = findOpaqueBounds(pixels, width, height)
      expect(bounds).toEqual({
        x: 1,
        y: 1,
        width: 2,
        height: 2
      })
    })

    it('respects alphaThreshold', () => {
      const width = 2
      const height = 2
      const pixels = new Uint8ClampedArray(width * height * 4)

      // Set (0,0) with alpha = 5
      pixels[3] = 5
      // Set (1,1) with alpha = 200
      pixels[(1 * 2 + 1) * 4 + 3] = 200

      // With threshold = 10, (0,0) is ignored
      const bounds = findOpaqueBounds(pixels, width, height, { alphaThreshold: 10 })
      expect(bounds).toEqual({
        x: 1,
        y: 1,
        width: 1,
        height: 1
      })
    })

    it('applies padding correctly without exceeding image boundaries', () => {
      const width = 10
      const height = 10
      const pixels = new Uint8ClampedArray(width * height * 4)

      // Pixel at (5,5)
      const index = (5 * width + 5) * 4
      pixels[index + 3] = 255

      const bounds = findOpaqueBounds(pixels, width, height, { padding: 2 })
      expect(bounds).toEqual({
        x: 3,
        y: 3,
        width: 5,
        height: 5
      })
    })

    it('clamps padding at borders', () => {
      const width = 5
      const height = 5
      const pixels = new Uint8ClampedArray(width * height * 4)

      // Pixel at (0,0)
      pixels[3] = 255

      const bounds = findOpaqueBounds(pixels, width, height, { padding: 2 })
      expect(bounds).toEqual({
        x: 0,
        y: 0,
        width: 3,
        height: 3
      })
    })
  })
})
