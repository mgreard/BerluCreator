export interface Point2D {
  x: number
  y: number
}

export interface BoxBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ResolvedLayerPosition {
  x: number
  y: number
  width: number
  height: number
  zIndex: number
  opacity: number
}

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'right' | 'bottom' | 'left'

export interface ResizeScales {
  scaleX: number
  scaleY: number
}

/**
 * Calcule les échelles d'un gizmo centré : les coins conservent le ratio
 * existant, tandis que les poignées latérales ne modifient qu'un seul axe.
 */
export function computeResizeScales(
  handle: ResizeHandle,
  bounds: BoxBounds,
  startPointer: Point2D,
  pointer: Point2D,
  startScaleX: number,
  startScaleY: number
): ResizeScales {
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  const isHorizontal = handle === 'left' || handle === 'right'
  const isVertical = handle === 'top' || handle === 'bottom'

  if (isHorizontal) {
    const initialDistance = Math.abs(startPointer.x - centerX)
    const currentDistance = Math.abs(pointer.x - centerX)
    return {
      scaleX: initialDistance > 0 ? startScaleX * (currentDistance / initialDistance) : startScaleX,
      scaleY: startScaleY
    }
  }

  if (isVertical) {
    const initialDistance = Math.abs(startPointer.y - centerY)
    const currentDistance = Math.abs(pointer.y - centerY)
    return {
      scaleX: startScaleX,
      scaleY: initialDistance > 0 ? startScaleY * (currentDistance / initialDistance) : startScaleY
    }
  }

  const initialDistance = Math.hypot(startPointer.x - centerX, startPointer.y - centerY)
  const currentDistance = Math.hypot(pointer.x - centerX, pointer.y - centerY)
  const ratio = initialDistance > 0 ? currentDistance / initialDistance : 1

  return {
    scaleX: startScaleX * ratio,
    scaleY: startScaleY * ratio
  }
}

/**
 * Calcule les bornes visuelles réelles d'un élément tenant compte de son échelle (centrée).
 */
export function computeTransformedBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  scaleX: number = 1,
  scaleY: number = 1
): BoxBounds {
  const scaledWidth = width * scaleX
  const scaledHeight = height * scaleY
  const visualX = x + (width - scaledWidth) / 2
  const visualY = y + (height - scaledHeight) / 2

  return {
    x: Math.round(visualX),
    y: Math.round(visualY),
    width: Math.round(scaledWidth),
    height: Math.round(scaledHeight)
  }
}
