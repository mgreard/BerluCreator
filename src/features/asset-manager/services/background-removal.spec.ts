import { describe, expect, it } from 'vitest'
import {
  fitImagePreview,
  fitInteractiveProcessingBuffer,
  removeConnectedBackground
} from './background-removal'

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

  it('limite le buffer interactif des images haute résolution sans changer leur ratio', () => {
    expect(fitInteractiveProcessingBuffer(4_000, 3_000)).toEqual({
      width: 1_000,
      height: 750,
      scale: 0.25
    })
    expect(fitInteractiveProcessingBuffer(640, 480)).toEqual({
      width: 640,
      height: 480,
      scale: 1
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

  it('parcourt l’intégralité d’un grand buffer connecté sans tronquer la file', () => {
    const width = 64
    const height = 64
    const data = new Uint8ClampedArray(width * height * 4)
    for (let offset = 0; offset < data.length; offset += 4) {
      data[offset] = 245
      data[offset + 1] = 245
      data[offset + 2] = 245
      data[offset + 3] = 255
    }

    const result = removeConnectedBackground(
      { width, height, data },
      { seed: { x: 0, y: 0 }, tolerance: 0 }
    )

    expect(Array.from(result.data).filter((_value, index) => index % 4 === 3))
      .toEqual(new Array(width * height).fill(0))
  })
})
