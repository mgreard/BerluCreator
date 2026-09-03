import { describe, expect, it } from 'vitest'
import {
  createDefaultAnchoredCalibration,
  resolveAnchoredPartGeometry,
  resolveAnchoredPartLocalTransform,
  resolveHeadGeometry,
  transformRigPoint
} from './rig-layout.engine'

describe('rig layout engine', () => {
  it('applique l’échelle puis la rotation autour de leurs origines explicites', () => {
    expect(
      transformRigPoint(
        { x: 15, y: 10 },
        { x: 10, y: 10 },
        2,
        1,
        90,
        { x: 30, y: 10 }
      )
    ).toEqual({ x: 30, y: 0 })
  })

  it('crée une nouvelle calibration centrale à chaque appel', () => {
    const first = createDefaultAnchoredCalibration()
    const second = createDefaultAnchoredCalibration()

    first.pivot.x = 0
    expect(second).toEqual({
      pivot: { x: 0.5, y: 0.5 },
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0
    })
  })

  it('applique le facteur de conversion des pixels natifs aux offsets ancrés', () => {
    const head = resolveHeadGeometry({
      x: 0,
      y: 0,
      width: 400,
      height: 400,
      scaleOrigin: { x: 200, y: 200 },
      scaleX: 0.4,
      scaleY: 0.4,
      rotation: 0
    })
    const withoutOffset = resolveAnchoredPartGeometry({
      head,
      anchor: { x: 0.5, y: 0.5 },
      calibration: createDefaultAnchoredCalibration(),
      assetSize: { width: 80, height: 40 },
      localUnitScaleX: 0.4,
      localUnitScaleY: 0.4
    })
    const withOffset = resolveAnchoredPartGeometry({
      head,
      anchor: { x: 0.5, y: 0.5 },
      calibration: {
        ...createDefaultAnchoredCalibration(),
        offsetX: 50,
        offsetY: 25
      },
      assetSize: { width: 80, height: 40 },
      localUnitScaleX: 0.4,
      localUnitScaleY: 0.4
    })

    expect(withOffset.transformOriginX - withoutOffset.transformOriginX).toBeCloseTo(8)
    expect(withOffset.transformOriginY - withoutOffset.transformOriginY).toBeCloseTo(4)
  })

  it('résout le transform local natif utilisé par les deux adaptateurs', () => {
    expect(
      resolveAnchoredPartLocalTransform({
        headSize: { width: 400, height: 500 },
        assetSize: { width: 200, height: 100 },
        anchor: { x: 0.5, y: 0.4 },
        calibration: {
          pivot: { x: 0.25, y: 0.75 },
          offsetX: 10,
          offsetY: -20,
          scale: 0.8,
          rotation: 15
        }
      })
    ).toEqual({ x: 160, y: 105, scaleX: 0.8, scaleY: 0.8, rotation: 15 })
  })

  it('respecte le pivot et compose la rotation et l’échelle avec la tête', () => {
    const geometry = resolveAnchoredPartGeometry({
      head: resolveHeadGeometry({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        scaleOrigin: { x: 50, y: 50 },
        scaleX: -0.5,
        scaleY: 0.5,
        rotation: 30
      }),
      anchor: { x: 0.5, y: 0.5 },
      calibration: {
        pivot: { x: 0.25, y: 0.75 },
        offsetX: 0,
        offsetY: 0,
        scale: 0.4,
        rotation: -10
      },
      assetSize: { width: 80, height: 40 }
    })

    expect(geometry.x).toBeCloseTo(30)
    expect(geometry.y).toBeCloseTo(20)
    expect(geometry.transformOriginX).toBeCloseTo(50)
    expect(geometry.transformOriginY).toBeCloseTo(50)
    expect(geometry.scaleX).toBeCloseTo(-0.2)
    expect(geometry.scaleY).toBeCloseTo(0.2)
    expect(geometry.rotation).toBe(20)
  })
})
