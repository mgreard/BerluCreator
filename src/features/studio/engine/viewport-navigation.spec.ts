import { describe, expect, it } from 'vitest'
import { panViewport, zoomViewportAt, type ViewportNavigation } from './viewport-navigation'

const initial: ViewportNavigation = { zoom: 1, panX: 0, panY: 0 }

describe('viewport navigation', () => {
  it('zoome sous le pointeur et conserve le contenu dans les limites du viewport', () => {
    const result = zoomViewportAt(initial, -120, { x: 300, y: 150 }, { width: 800, height: 450 })

    expect(result.zoom).toBeGreaterThan(1)
    expect(result.panX).toBeLessThan(0)
    expect(result.panY).toBeLessThan(0)
  })

  it('revient exactement au cadrage initial au niveau de zoom minimum', () => {
    const result = zoomViewportAt(
      { zoom: 1.8, panX: -120, panY: 80 },
      10000,
      { x: 0, y: 0 },
      { width: 800, height: 450 }
    )

    expect(result).toEqual(initial)
  })

  it('borne le pan selon le niveau de zoom', () => {
    expect(
      panViewport({ zoom: 2, panX: 0, panY: 0 }, 1000, -1000, { width: 800, height: 450 })
    ).toEqual({ zoom: 2, panX: 400, panY: -225 })
  })
})
