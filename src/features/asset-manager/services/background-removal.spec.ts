import { describe, expect, it } from 'vitest'
import { fitImagePreview, removeConnectedBackground } from './background-removal'

describe('background removal', () => {
  it('expands a small asset to the available sampling area while preserving its ratio', () => {
    expect(fitImagePreview(100, 50, 800, 600)).toEqual({
      width: 800,
      height: 400,
      scale: 8
    })
  })

  it('shrinks a large asset to fit both available dimensions', () => {
    expect(fitImagePreview(2_000, 1_000, 900, 300)).toEqual({
      width: 600,
      height: 300,
      scale: 0.3
    })
  })

  it('removes only the connected sampled region', () => {
    const source = {
      width: 3,
      height: 1,
      data: new Uint8ClampedArray([
        255, 255, 255, 255,
        0, 0, 0, 255,
        255, 255, 255, 255
      ])
    }

    const result = removeConnectedBackground(source, {
      seed: { x: 0, y: 0 },
      tolerance: 0
    })

    expect(result.data[3]).toBe(0)
    expect(result.data[7]).toBe(255)
    expect(result.data[11]).toBe(255)
  })
})
