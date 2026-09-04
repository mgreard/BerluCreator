import { describe, expect, it } from 'vitest'
import {
  computeCoverMinScale,
  computeBackgroundCoverTransform,
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

  it('computes initial cover transform centered in the viewport', () => {
    const transform = computeBackgroundCoverTransform({
      assetWidth: 2400,
      assetHeight: 1350,
      ...stage
    })
    expect(transform.scaleX).toBe(0.8)
    expect(transform.scaleY).toBe(0.8)
    expect(transform.x).toBe(Math.round((1920 - 2400) / 2)) // -240
    expect(transform.y).toBe(Math.round((1080 - 1350) / 2)) // -135
  })

  it('allows free scaling (reduced without constraint or enlarged beyond viewport) and free translation by default', () => {
    const params = { assetWidth: 2400, assetHeight: 1350, ...stage }

    // Réduction en-dessous du cover scale (ex: 0.4 < 0.8)
    const reduced = clampBackgroundCover({ x: 200, y: 150, scaleX: 0.4, scaleY: 0.4 }, params)
    expect(reduced.scaleX).toBe(0.4)
    expect(reduced.scaleY).toBe(0.4)
    expect(reduced.x).toBe(200)
    expect(reduced.y).toBe(150)

    // Agrandissement au-delà du viewport (ex: 2.5 > 0.8)
    const enlarged = clampBackgroundCover({ x: -500, y: -300, scaleX: 2.5, scaleY: 2.5 }, params)
    expect(enlarged.scaleX).toBe(2.5)
    expect(enlarged.scaleY).toBe(2.5)
    expect(enlarged.x).toBe(-500)
    expect(enlarged.y).toBe(-300)
  })

  it('clamps translation and scale when strictClamp is explicitly requested', () => {
    const params = { assetWidth: 2400, assetHeight: 1350, ...stage }
    const minScale = computeCoverMinScale(params) // 0.8

    const clampedRight = clampBackgroundCover(
      { x: 150, y: 0, scaleX: minScale, scaleY: minScale },
      params,
      { strictClamp: true }
    )
    expect(clampedRight.x).toBe(0)
    expect(clampedRight.y).toBe(0)

    const clampedLeft = clampBackgroundCover(
      { x: -200, y: 0, scaleX: minScale, scaleY: minScale },
      params,
      { strictClamp: true }
    )
    expect(clampedLeft.x).toBe(0)
  })
})
