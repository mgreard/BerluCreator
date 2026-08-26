import { describe, expect, it } from 'vitest'
import { normalizeSliceRect, useSpritesheetSlicer } from './useSpritesheetSlicer'

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

describe('noms et catégorie des découpes', () => {
  it('renomme seulement les découpes automatiques lors du changement de catégorie', () => {
    const slicer = useSpritesheetSlicer()
    slicer.naturalWidth.value = 200
    slicer.naturalHeight.value = 200
    const first = slicer.addSlice({ x: 0, y: 0, width: 40, height: 40 }, 'mouth')
    const second = slicer.addSlice({ x: 50, y: 0, width: 40, height: 40 }, 'mouth')
    slicer.updateSlice(second.id, { name: 'sourire-special' })

    slicer.setCategoryForAll('eyes')

    expect(slicer.slices.value[0]).toMatchObject({ name: 'yeux-01', category: 'eyes', nameMode: 'auto' })
    expect(slicer.slices.value[1]).toMatchObject({ name: 'sourire-special', category: 'eyes', nameMode: 'custom' })
    expect(first.name).toBe('bouche-01')
  })
})
