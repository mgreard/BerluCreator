import { describe, expect, it } from 'vitest'
import {
  clampRigViewportZoom,
  computeBoundingBoxFit,
  normalizeRotation,
  pointerAngle,
  screenDeltaToLocal,
  useRigViewportNavigation
} from './useRigViewportNavigation'

describe('useRigViewportNavigation geometry', () => {
  it('limite le zoom entre 1 % et 400 %', () => {
    expect(clampRigViewportZoom(0.001)).toBe(0.01)
    expect(clampRigViewportZoom(1.234)).toBe(1.23)
    expect(clampRigViewportZoom(8)).toBe(4)
  })

  it.each([
    {
      label: 'portrait très haut',
      box: { x: 900, y: 100, width: 600, height: 3200 },
      container: { width: 720, height: 480 }
    },
    {
      label: 'corps très large',
      box: { x: 100, y: 900, width: 3600, height: 700 },
      container: { width: 640, height: 720 }
    }
  ])('garde un $label entier dans la marge de sécurité', ({ box, container }) => {
    const padding = { top: 72, bottom: 40, left: 56, right: 56 }
    const stage = { width: 4000, height: 3600 }
    const fit = computeBoundingBoxFit(
      container.width,
      container.height,
      stage.width,
      stage.height,
      box,
      padding
    )!
    const left = container.width / 2 + (box.x - stage.width / 2) * fit.zoom + fit.panX
    const top = container.height / 2 + (box.y - stage.height / 2) * fit.zoom + fit.panY
    const right = left + box.width * fit.zoom
    const bottom = top + box.height * fit.zoom

    expect(left).toBeGreaterThanOrEqual(padding.left - 1)
    expect(top).toBeGreaterThanOrEqual(padding.top - 1)
    expect(right).toBeLessThanOrEqual(container.width - padding.right + 1)
    expect(bottom).toBeLessThanOrEqual(container.height - padding.bottom + 1)
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

  it('zoome avec la molette seule en conservant le point sous le pointeur', () => {
    const navigation = useRigViewportNavigation()
    const containerRect = {
      left: 100,
      top: 50,
      width: 800,
      height: 600
    } as DOMRect
    const wheelEvent = new WheelEvent('wheel', {
      cancelable: true,
      clientX: 700,
      clientY: 250,
      deltaY: -100
    })
    const mouseX = wheelEvent.clientX - containerRect.left - containerRect.width / 2
    const mouseY = wheelEvent.clientY - containerRect.top - containerRect.height / 2
    const worldXBefore = (mouseX - navigation.panX.value) / navigation.zoom.value
    const worldYBefore = (mouseY - navigation.panY.value) / navigation.zoom.value

    navigation.handleWheel(wheelEvent, containerRect)

    expect(wheelEvent.defaultPrevented).toBe(true)
    expect(navigation.zoom.value).toBe(1.1)
    expect((mouseX - navigation.panX.value) / navigation.zoom.value).toBeCloseTo(worldXBefore)
    expect((mouseY - navigation.panY.value) / navigation.zoom.value).toBeCloseTo(worldYBefore)
  })

  it('dézoome avec la molette vers le bas sans déplacer librement le viewport', () => {
    const navigation = useRigViewportNavigation()
    const containerRect = {
      left: 0,
      top: 0,
      width: 800,
      height: 600
    } as DOMRect

    navigation.handleWheel(new WheelEvent('wheel', {
      clientX: 400,
      clientY: 300,
      deltaX: 80,
      deltaY: 100
    }), containerRect)

    expect(navigation.zoom.value).toBe(0.9)
    expect(navigation.panX.value).toBe(0)
    expect(navigation.panY.value).toBe(0)
  })
})
