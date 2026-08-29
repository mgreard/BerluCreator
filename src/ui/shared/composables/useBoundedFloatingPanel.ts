import { computed, ref, type ComputedRef, type Ref } from 'vue'

export interface FloatingPanelPosition {
  x: number
  y: number
}

interface FloatingPanelDrag {
  pointerId: number
  target: HTMLElement
  offsetX: number
  offsetY: number
}

type ElementRef = Readonly<Ref<HTMLElement | null>>
type FloatingPanelStyle = Record<string, string>

export interface BoundedFloatingPanel {
  isDragging: Readonly<Ref<boolean>>
  position: Ref<FloatingPanelPosition | null>
  style: ComputedRef<FloatingPanelStyle>
  beginDrag: (event: PointerEvent) => void
  moveDrag: (event: PointerEvent) => void
  endDrag: (event: PointerEvent) => void
  nudge: (event: KeyboardEvent) => void
  constrain: () => void
}

export function useBoundedFloatingPanel(
  containerRef: ElementRef,
  panelRef: ElementRef,
  fallbackStyle: FloatingPanelStyle,
  margin = 8
): BoundedFloatingPanel {
  const position = ref<FloatingPanelPosition | null>(null)
  const drag = ref<FloatingPanelDrag | null>(null)
  const isDragging = computed(() => drag.value !== null)
  const style = computed<FloatingPanelStyle>(() =>
    position.value
      ? { left: `${position.value.x}px`, top: `${position.value.y}px` }
      : fallbackStyle
  )

  function currentPosition(): FloatingPanelPosition | null {
    if (position.value) return { ...position.value }
    const container = containerRef.value
    const panel = panelRef.value
    if (!container || !panel) return null
    const containerRect = container.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    return {
      x: panelRect.left - containerRect.left,
      y: panelRect.top - containerRect.top
    }
  }

  function boundedPosition(x: number, y: number): FloatingPanelPosition | null {
    const container = containerRef.value
    const panel = panelRef.value
    if (!container || !panel) return null
    const containerRect = container.getBoundingClientRect()
    const panelRect = panel.getBoundingClientRect()
    return {
      x: Math.min(Math.max(x, margin), Math.max(margin, containerRect.width - panelRect.width - margin)),
      y: Math.min(
        Math.max(y, margin),
        Math.max(margin, containerRect.height - panelRect.height - margin)
      )
    }
  }

  function constrain(): void {
    const current = currentPosition()
    if (!current) return
    position.value = boundedPosition(current.x, current.y)
  }

  function beginDrag(event: PointerEvent): void {
    if (event.button !== 0) return
    const panel = panelRef.value
    const container = containerRef.value
    if (!panel || !container) return
    event.preventDefault()
    event.stopPropagation()
    const panelRect = panel.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    const target = event.currentTarget as HTMLElement
    position.value = boundedPosition(
      panelRect.left - containerRect.left,
      panelRect.top - containerRect.top
    )
    drag.value = {
      pointerId: event.pointerId,
      target,
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top
    }
    target.setPointerCapture?.(event.pointerId)
  }

  function moveDrag(event: PointerEvent): void {
    const active = drag.value
    const container = containerRef.value
    if (!active || active.pointerId !== event.pointerId || !container) return
    event.preventDefault()
    event.stopPropagation()
    const containerRect = container.getBoundingClientRect()
    position.value = boundedPosition(
      event.clientX - containerRect.left - active.offsetX,
      event.clientY - containerRect.top - active.offsetY
    )
  }

  function endDrag(event: PointerEvent): void {
    const active = drag.value
    if (!active || active.pointerId !== event.pointerId) return
    event.preventDefault()
    event.stopPropagation()
    if (active.target.hasPointerCapture?.(event.pointerId)) {
      active.target.releasePointerCapture(event.pointerId)
    }
    drag.value = null
  }

  function nudge(event: KeyboardEvent): void {
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1]
    }[event.key]
    if (!direction) return
    event.preventDefault()
    event.stopPropagation()
    const current = currentPosition()
    if (!current) return
    const step = event.shiftKey ? 24 : 8
    position.value = boundedPosition(
      current.x + direction[0] * step,
      current.y + direction[1] * step
    )
  }

  return {
    isDragging,
    position,
    style,
    beginDrag,
    moveDrag,
    endDrag,
    nudge,
    constrain
  }
}
