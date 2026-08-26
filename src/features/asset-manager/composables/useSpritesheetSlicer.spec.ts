import { describe, expect, it } from 'vitest'
import { normalizeSliceRect } from './useSpritesheetSlicer'

describe('normalizeSliceRect', () => {
  it('normalise un tracé effectué de bas en haut et de droite à gauche', () => {
    expect(normalizeSliceRect({ x: 80, y: 70, width: -40, height: -30 }, 100, 100)).toEqual({
      x: 40,
      y: 40,
      width: 40,
      height: 30
    })
  })

  it('borne la découpe aux dimensions de la planche', () => {
    expect(normalizeSliceRect({ x: -20, y: 80, width: 150, height: 50 }, 100, 100)).toEqual({
      x: 0,
      y: 80,
      width: 100,
      height: 20
    })
  })

  it('retourne une zone vide lorsque le tracé est entièrement hors image', () => {
    expect(normalizeSliceRect({ x: 120, y: 20, width: 30, height: 30 }, 100, 100)).toEqual({
      x: 100,
      y: 20,
      width: 0,
      height: 30
    })
  })
})
