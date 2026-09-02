import { ref, computed } from 'vue'

export const MIN_RIG_VIEWPORT_ZOOM = 0.25
export const MAX_RIG_VIEWPORT_ZOOM = 4

export interface Point {
  x: number
  y: number
}

export function clampRigViewportZoom(value: number): number {
  return Math.max(MIN_RIG_VIEWPORT_ZOOM, Math.min(MAX_RIG_VIEWPORT_ZOOM, Number(value.toFixed(2))))
}

export function screenDeltaToLocal(
  deltaX: number,
  deltaY: number,
  zoom: number,
  rotation = 0,
  scale = 1
): Point {
  const safeFactor = Math.max(Number.EPSILON, zoom * scale)
  const radians = (-rotation * Math.PI) / 180
  const x = deltaX / safeFactor
  const y = deltaY / safeFactor
  return {
    x: x * Math.cos(radians) - y * Math.sin(radians),
    y: x * Math.sin(radians) + y * Math.cos(radians)
  }
}

export function pointerAngle(point: Point, pivot: Point): number {
  return (Math.atan2(point.y - pivot.y, point.x - pivot.x) * 180) / Math.PI
}

export function normalizeRotation(value: number): number {
  let normalized = value % 360
  if (normalized > 180) normalized -= 360
  if (normalized < -180) normalized += 360
  return Math.abs(normalized) <= 1 ? 0 : normalized
}

export function useRigViewportNavigation() {
  const zoom = ref(1)
  const panX = ref(0)
  const panY = ref(0)
  const isPanning = ref(false)
  const startPanMouse = ref<Point>({ x: 0, y: 0 })
  const startPanPos = ref<Point>({ x: 0, y: 0 })

  const zoomPercentage = computed(() => Math.round(zoom.value * 100))

  function setZoom(val: number): void {
    zoom.value = clampRigViewportZoom(val)
  }

  function zoomIn(step = 0.1): void {
    setZoom(zoom.value + step)
  }

  function zoomOut(step = 0.1): void {
    setZoom(zoom.value - step)
  }

  function resetView(): void {
    zoom.value = 1
    panX.value = 0
    panY.value = 0
  }

  function fitToViewport(
    containerWidth: number,
    containerHeight: number,
    contentWidth = 840,
    contentHeight = 908,
    padding = 48
  ): void {
    if (containerWidth <= 0 || containerHeight <= 0) return
    const availableW = Math.max(100, containerWidth - padding * 2)
    const availableH = Math.max(100, containerHeight - padding * 2)
    const scale = Math.min(availableW / contentWidth, availableH / contentHeight, 1.5)
    zoom.value = clampRigViewportZoom(scale)
    panX.value = 0
    panY.value = 0
  }

  function startPan(clientX: number, clientY: number): void {
    isPanning.value = true
    startPanMouse.value = { x: clientX, y: clientY }
    startPanPos.value = { x: panX.value, y: panY.value }
  }

  function updatePan(clientX: number, clientY: number): void {
    if (!isPanning.value) return
    const dx = clientX - startPanMouse.value.x
    const dy = clientY - startPanMouse.value.y
    panX.value = startPanPos.value.x + dx
    panY.value = startPanPos.value.y + dy
  }

  function endPan(): void {
    isPanning.value = false
  }

  function handleWheel(e: WheelEvent, containerRect: DOMRect): void {
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      const newZoom = clampRigViewportZoom(zoom.value * zoomFactor)
      
      const mouseX = e.clientX - containerRect.left - containerRect.width / 2
      const mouseY = e.clientY - containerRect.top - containerRect.height / 2
      
      panX.value = mouseX - ((mouseX - panX.value) / zoom.value) * newZoom
      panY.value = mouseY - ((mouseY - panY.value) / zoom.value) * newZoom
      zoom.value = newZoom
    } else {
      panX.value -= e.deltaX
      panY.value -= e.deltaY
    }
  }

  return {
    zoom,
    zoomPercentage,
    panX,
    panY,
    isPanning,
    setZoom,
    zoomIn,
    zoomOut,
    resetView,
    fitToViewport,
    startPan,
    updatePan,
    endPan,
    handleWheel
  }
}
