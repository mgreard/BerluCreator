/**
 * Moteur mathématique de contrainte « Cover » pour le calque d'arrière-plan (Background).
 *
 * Garantit que l'image de fond remplit en permanence 100% de la surface du viewport
 * sans aucun décrochage des bords ni interstice transparent.
 */

export interface BackgroundCoverParams {
  assetWidth: number
  assetHeight: number
  stageWidth: number
  stageHeight: number
}

export interface ClampedBackgroundTransform {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

/**
 * Calcule l'échelle minimale requise pour que l'image couvre entièrement le viewport.
 */
export function computeCoverMinScale(params: BackgroundCoverParams): number {
  if (params.assetWidth <= 0 || params.assetHeight <= 0) return 1
  const scaleX = params.stageWidth / params.assetWidth
  const scaleY = params.stageHeight / params.assetHeight
  return Math.max(scaleX, scaleY)
}

/**
 * Ajuste les coordonnées (x, y) et l'échelle (scaleX, scaleY) de l'arrière-plan
 * pour satisfaire la contrainte stricte de cadrage « Cover ».
 */
export function clampBackgroundCover(
  transform: { x?: number; y?: number; scaleX?: number; scaleY?: number },
  params: BackgroundCoverParams
): ClampedBackgroundTransform {
  const minScale = computeCoverMinScale(params)

  const rawScale = transform.scaleX ?? transform.scaleY ?? 1

  // L'échelle effective ne peut jamais être inférieure à l'échelle de couverture minimale
  const scale = Math.max(minScale, rawScale)

  const renderedWidth = params.assetWidth * scale
  const renderedHeight = params.assetHeight * scale

  // Bornes de translation autorisées (x <= 0 et x + renderedWidth >= stageWidth)
  const minX = params.stageWidth - renderedWidth
  const maxX = 0
  const minY = params.stageHeight - renderedHeight
  const maxY = 0

  const rawX = transform.x ?? 0
  const rawY = transform.y ?? 0

  const x = Math.round(Math.min(maxX, Math.max(minX, rawX)))
  const y = Math.round(Math.min(maxY, Math.max(minY, rawY)))

  return {
    x,
    y,
    scaleX: scale,
    scaleY: scale
  }
}
