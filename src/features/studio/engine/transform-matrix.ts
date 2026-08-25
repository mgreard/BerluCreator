import type { AnchorPoint } from '@core/types/asset.types'

export interface Point2D {
  x: number
  y: number
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
 * Calcule la position d'un élément enfant par rapport à son parent en faisant coïncider
 * le point de montage (Mount) de l'enfant avec le point d'accueil (Socket) du parent.
 */
export function resolveChildPosition(
  parentPos: Point2D,
  parentSocket: AnchorPoint | undefined,
  childMount: AnchorPoint | undefined
): Point2D {
  if (!parentSocket || !childMount) {
    return { ...parentPos }
  }

  return {
    x: parentPos.x + parentSocket.x - childMount.x,
    y: parentPos.y + parentSocket.y - childMount.y
  }
}
