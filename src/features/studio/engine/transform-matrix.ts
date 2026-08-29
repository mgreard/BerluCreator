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

export type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'top' | 'right' | 'bottom' | 'left' | 'rot'

export interface ResizeScales {
  scaleX: number
  scaleY: number
}

/**
 * Calcule une échelle uniforme depuis n'importe quelle poignée.
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
  let ratio = 1
  if (handle === 'left' || handle === 'right') {
    const initialDistance = Math.abs(startPointer.x - centerX)
    const currentDistance = Math.abs(pointer.x - centerX)
    ratio = initialDistance > 0 ? currentDistance / initialDistance : 1
  } else if (handle === 'top' || handle === 'bottom') {
    const initialDistance = Math.abs(startPointer.y - centerY)
    const currentDistance = Math.abs(pointer.y - centerY)
    ratio = initialDistance > 0 ? currentDistance / initialDistance : 1
  } else {
    const initialDistance = Math.hypot(startPointer.x - centerX, startPointer.y - centerY)
    const currentDistance = Math.hypot(pointer.x - centerX, pointer.y - centerY)
    ratio = initialDistance > 0 ? currentDistance / initialDistance : 1
  }
  const startScale = startScaleX || startScaleY
  return {
    scaleX: startScale * ratio,
    scaleY: startScale * ratio
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
  scaleY: number = 1,
  originX: number = x + width / 2,
  originY: number = y + height / 2
): BoxBounds {
  const left = originX + (x - originX) * scaleX
  const right = originX + (x + width - originX) * scaleX
  const top = originY + (y - originY) * scaleY
  const bottom = originY + (y + height - originY) * scaleY

  return {
    x: Math.round(Math.min(left, right)),
    y: Math.round(Math.min(top, bottom)),
    width: Math.round(Math.abs(right - left)),
    height: Math.round(Math.abs(bottom - top))
  }
}
