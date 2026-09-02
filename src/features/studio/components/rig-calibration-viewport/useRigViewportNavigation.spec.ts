import { describe, expect, it } from 'vitest'
import {
  clampRigViewportZoom,
  normalizeRotation,
  pointerAngle,
  screenDeltaToLocal
} from './useRigViewportNavigation'

describe('useRigViewportNavigation geometry', () => {
  it('limite le zoom entre 25 % et 400 %', () => {
    expect(clampRigViewportZoom(0.1)).toBe(0.25)
    expect(clampRigViewportZoom(1.234)).toBe(1.23)
    expect(clampRigViewportZoom(8)).toBe(4)
  })

  it('convertit un déplacement écran dans le repère local zoomé et tourné', () => {
    expect(screenDeltaToLocal(40, 20, 2)).toEqual({ x: 20, y: 10 })
    const rotated = screenDeltaToLocal(0, 20, 2, 90)
    expect(rotated.x).toBeCloseTo(10)
    expect(rotated.y).toBeCloseTo(0)
  })

  it('tient compte de l’échelle locale de la tête', () => {
    expect(screenDeltaToLocal(20, 0, 2, 0, 0.5)).toEqual({ x: 20, y: 0 })
  })

  it('calcule et normalise les rotations autour du pivot', () => {
    expect(pointerAngle({ x: 0, y: 10 }, { x: 0, y: 0 })).toBe(90)
    expect(normalizeRotation(270)).toBe(-90)
    expect(normalizeRotation(-270)).toBe(90)
    expect(normalizeRotation(0.5)).toBe(0)
  })
})
