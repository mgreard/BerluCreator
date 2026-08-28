import { describe, expect, it } from 'vitest'
import { computeSuggestedRigCalibration } from './rig-auto-calibration'

const profile = { canvasWidth: 840, canvasHeight: 908 }

describe('computeSuggestedRigCalibration', () => {
  it('préserve les anciens sprites déjà alignés sur le canevas canonique', () => {
    expect(
      computeSuggestedRigCalibration(
        { width: 840, height: 908, category: 'head' },
        { x: 200, y: 50, width: 400, height: 300 },
        profile
      )
    ).toMatchObject({ x: 0, y: 0, scaleX: 1, scaleY: 1 })
  })

  it('aligne le bas visible d’une nouvelle tête sur l’ancre de cou', () => {
    const calibration = computeSuggestedRigCalibration(
      { width: 260, height: 309, category: 'head' },
      { x: 10, y: 8, width: 240, height: 290 },
      profile
    )
    const visibleBottom = calibration.y + (8 + 290) * calibration.scaleY
    expect(visibleBottom).toBeCloseTo(profile.canvasHeight * 0.36, 0)
    expect(calibration.scaleX).toBe(calibration.scaleY)
  })

  it('fait tenir un corps de dimensions libres sans modifier le repère du rig', () => {
    const calibration = computeSuggestedRigCalibration(
      { width: 1031, height: 812, category: 'body' },
      { x: 20, y: 4, width: 990, height: 800 },
      profile
    )
    expect(calibration.scaleX).toBeLessThan(1)
    expect(calibration.y + (4 + 800) * calibration.scaleY).toBeCloseTo(
      profile.canvasHeight * 0.97,
      0
    )
  })
})
