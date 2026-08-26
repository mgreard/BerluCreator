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
