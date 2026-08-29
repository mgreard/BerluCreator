import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useBoundedFloatingPanel } from './useBoundedFloatingPanel'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON: () => ({})
  }
}

describe('useBoundedFloatingPanel', () => {
  it('déplace le panneau sans le laisser sortir du conteneur', () => {
    const container = document.createElement('div')
    const panel = document.createElement('section')
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(100, 50, 500, 300))
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(rect(120, 70, 180, 100))
    const floating = useBoundedFloatingPanel(ref(container), ref(panel), { right: '12px' })
    const handle = document.createElement('button')
    handle.setPointerCapture = vi.fn()
    handle.releasePointerCapture = vi.fn()

    floating.beginDrag({
      button: 0,
      pointerId: 4,
      clientX: 140,
      clientY: 90,
      currentTarget: handle,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as PointerEvent)
    floating.moveDrag({
      pointerId: 4,
      clientX: 900,
      clientY: 700,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as PointerEvent)

    expect(floating.position.value).toEqual({ x: 312, y: 192 })
    expect(floating.style.value).toEqual({ left: '312px', top: '192px' })
  })

  it('accepte les flèches et un pas accélé avec Maj', () => {
    const container = document.createElement('div')
    const panel = document.createElement('section')
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(rect(0, 0, 500, 300))
    vi.spyOn(panel, 'getBoundingClientRect').mockReturnValue(rect(20, 30, 180, 100))
    const floating = useBoundedFloatingPanel(ref(container), ref(panel), { left: '20px' })

    floating.nudge({
      key: 'ArrowRight',
      shiftKey: true,
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as KeyboardEvent)

    expect(floating.position.value).toEqual({ x: 44, y: 30 })
  })
})
