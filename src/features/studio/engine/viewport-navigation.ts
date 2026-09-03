export interface ViewportNavigation {
  zoom: number
  panX: number
  panY: number
}

interface ViewportSize {
  width: number
  height: number
}

interface PointerOffset {
  /** Position du pointeur par rapport au centre actuellement rendu. */
  x: number
  y: number
}

const MIN_ZOOM = 1
const MAX_ZOOM = 4

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum)
}

function clampPan(
  navigation: ViewportNavigation,
  size: ViewportSize
): ViewportNavigation {
  if (navigation.zoom <= MIN_ZOOM) return { zoom: MIN_ZOOM, panX: 0, panY: 0 }
  const maxPanX = (size.width * (navigation.zoom - 1)) / 2
  const maxPanY = (size.height * (navigation.zoom - 1)) / 2
  return {
    zoom: navigation.zoom,
    panX: clamp(navigation.panX, -maxPanX, maxPanX),
    panY: clamp(navigation.panY, -maxPanY, maxPanY)
  }
}

export function zoomViewportAt(
  navigation: ViewportNavigation,
  deltaY: number,
  pointer: PointerOffset,
  size: ViewportSize
): ViewportNavigation {
  if (!Number.isFinite(deltaY) || deltaY === 0 || size.width <= 0 || size.height <= 0) {
    return navigation
  }
  const zoom = clamp(
    navigation.zoom * Math.exp(-deltaY * 0.0015),
    MIN_ZOOM,
    MAX_ZOOM
  )
  if (zoom === navigation.zoom) return navigation
  const ratio = zoom / navigation.zoom
  return clampPan(
    {
      zoom,
      panX: navigation.panX + pointer.x * (1 - ratio),
      panY: navigation.panY + pointer.y * (1 - ratio)
    },
    size
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
