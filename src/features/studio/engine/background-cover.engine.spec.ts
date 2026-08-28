import { describe, expect, it } from 'vitest'
import {
  computeCoverMinScale,
  clampBackgroundCover
} from './background-cover.engine'

describe('background-cover.engine', () => {
  const stage = { stageWidth: 1920, stageHeight: 1080 }

  it('computes minimal scale needed to fully cover the stage', () => {
    // Image 1920x1080 -> scale = 1.0
    expect(computeCoverMinScale({ assetWidth: 1920, assetHeight: 1080, ...stage })).toBe(1.0)

    // Image 3840x2160 (4K 16:9) -> scale = 0.5
    expect(computeCoverMinScale({ assetWidth: 3840, assetHeight: 2160, ...stage })).toBe(0.5)

    // Image 1000x1000 (1:1) -> stage 1920x1080 requires scale = 1.92
    expect(computeCoverMinScale({ assetWidth: 1000, assetHeight: 1000, ...stage })).toBe(1.92)
  })

  it('clamps translation so no transparent gaps appear on stage boundaries', () => {
    const params = { assetWidth: 2400, assetHeight: 1350, ...stage }
    const minScale = computeCoverMinScale(params) // 1920/2400 = 0.8

    // Translation excessive vers la droite (x > 0) -> clampée à 0
    const clampedRight = clampBackgroundCover({ x: 150, y: 0, scaleX: minScale, scaleY: minScale }, params)
    expect(clampedRight.x).toBe(0)
    expect(clampedRight.y).toBe(0)

    // Translation excessive vers la gauche (x < stageWidth - renderedWidth)
    // renderedWidth = 2400 * 0.8 = 1920 -> minX = 0
    const clampedLeft = clampBackgroundCover({ x: -200, y: 0, scaleX: minScale, scaleY: minScale }, params)
    expect(clampedLeft.x).toBe(0)

    // Avec une échelle plus grande (scale = 1.0 -> width = 2400, height = 1350)
    // minX = 1920 - 2400 = -480, minY = 1080 - 1350 = -270
    const larger = clampBackgroundCover({ x: -300, y: -100, scaleX: 1.0, scaleY: 1.0 }, params)
    expect(larger.x).toBe(-300)
    expect(larger.y).toBe(-100)

    // Dépassement à gauche avec grand scale
    const overLeft = clampBackgroundCover({ x: -600, y: -400, scaleX: 1.0, scaleY: 1.0 }, params)
    expect(overLeft.x).toBe(-480)
    expect(overLeft.y).toBe(-270)
  })

  it('normalise une ancienne échelle déformée sur un ratio uniforme', () => {
    const result = clampBackgroundCover(
      { x: 0, y: 0, scaleX: 1.25, scaleY: 3 },
      { assetWidth: 1920, assetHeight: 1080, ...stage }
    )
    expect(result.scaleX).toBe(1.25)
    expect(result.scaleY).toBe(1.25)
  })
})
