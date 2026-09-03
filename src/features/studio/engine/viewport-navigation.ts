export interface ViewportNavigation {
  zoom: number
  panX: number
  panY: number
}

export interface ViewportSize {
  width: number
  height: number
}

export interface ViewportPoint {
  x: number
  y: number
}

export interface BoundingBox extends ViewportPoint {
  width: number
  height: number
}

export interface ViewportPadding {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

export type ViewportFit = ViewportNavigation

export interface ViewportZoomPolicy {
  minZoom: number
  maxZoom: number
  precision?: number
  clampPan?: boolean
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

export function clampViewportZoom(value: number, policy: ViewportZoomPolicy): number {
  const clamped = clamp(value, policy.minZoom, policy.maxZoom)
  return policy.precision === undefined
    ? clamped
    : Number(clamped.toFixed(policy.precision))
}

function clampPan(
  navigation: ViewportNavigation,
  size: ViewportSize,
  minimumZoom = MIN_ZOOM
): ViewportNavigation {
  if (navigation.zoom <= minimumZoom) return { zoom: minimumZoom, panX: 0, panY: 0 }
  const maxPanX = (size.width * (navigation.zoom - 1)) / 2
  const maxPanY = (size.height * (navigation.zoom - 1)) / 2
  return {
    zoom: navigation.zoom,
    panX: clamp(navigation.panX, -maxPanX, maxPanX),
    panY: clamp(navigation.panY, -maxPanY, maxPanY)
  }
}

export function zoomViewportTo(
  navigation: ViewportNavigation,
  requestedZoom: number,
  /** Position du pointeur par rapport au centre actuellement rendu. */
  pointer: ViewportPoint,
  size: ViewportSize,
  policy: ViewportZoomPolicy
): ViewportNavigation {
  const zoom = clampViewportZoom(requestedZoom, policy)
  if (zoom === navigation.zoom) return navigation
  const ratio = zoom / navigation.zoom
  const next = {
    zoom,
    panX: navigation.panX + pointer.x * (1 - ratio),
    panY: navigation.panY + pointer.y * (1 - ratio)
  }
  return policy.clampPan ? clampPan(next, size, policy.minZoom) : next
}

export function zoomViewportAt(
  navigation: ViewportNavigation,
  deltaY: number,
  pointer: ViewportPoint,
  size: ViewportSize
): ViewportNavigation {
  if (!Number.isFinite(deltaY) || deltaY === 0 || size.width <= 0 || size.height <= 0) {
    return navigation
  }
  return zoomViewportTo(
    navigation,
    navigation.zoom * Math.exp(-deltaY * 0.0015),
    pointer,
    size,
    { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM, clampPan: true }
  )
}

export function panViewport(
  navigation: ViewportNavigation,
  deltaX: number,
  deltaY: number,
  size: ViewportSize
): ViewportNavigation {
  return clampPan(
    {
      ...navigation,
      panX: navigation.panX + deltaX,
      panY: navigation.panY + deltaY
    },
    size
  )
}

export function computeBoundingBoxFit(
  containerWidth: number,
  containerHeight: number,
  stageWidth: number,
  stageHeight: number,
  box: BoundingBox,
  padding: ViewportPadding = { top: 60, bottom: 40, left: 48, right: 48 }
): ViewportFit | null {
  if (containerWidth <= 0 || containerHeight <= 0 || box.width <= 0 || box.height <= 0) {
    return null
  }

  const padTop = Math.max(0, padding.top ?? 60)
  const padBottom = Math.max(0, padding.bottom ?? 40)
  const padLeft = Math.max(0, padding.left ?? 48)
  const padRight = Math.max(0, padding.right ?? 48)
  const availableWidth = Math.max(1, containerWidth - padLeft - padRight)
  const availableHeight = Math.max(1, containerHeight - padTop - padBottom)
  const exactZoom = Math.min(availableWidth / box.width, availableHeight / box.height, 2)
  const zoom = Math.max(Number.EPSILON, Math.floor(exactZoom * 10000) / 10000)
  const boxCenterX = box.x + box.width / 2
  const boxCenterY = box.y + box.height / 2

  return {
    zoom,
    panX: Math.round((padLeft - padRight) / 2 - (boxCenterX - stageWidth / 2) * zoom),
    panY: Math.round((padTop - padBottom) / 2 - (boxCenterY - stageHeight / 2) * zoom)
  }
}
