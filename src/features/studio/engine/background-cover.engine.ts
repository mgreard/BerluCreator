/**
 * Moteur mathématique de cadrage et redimensionnement pour l'arrière-plan (Background).
 *
 * Fournit le calcul du cadrage « Cover » initial dans le viewport tout en permettant
 * d'agrandir l'image au-delà du viewport ou de la réduire sans contrainte.
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

export interface ClampBackgroundCoverOptions {
  strictClamp?: boolean
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
 * Calcule la transformation permettant à l'arrière-plan de démarrer en cadrage « Cover »
 * centré dans le viewport (100% de la surface couverte sans bandes noires).
 */
export function computeBackgroundCoverTransform(
  params: BackgroundCoverParams
): ClampedBackgroundTransform {
  const minScale = computeCoverMinScale(params)
  const x = Math.round((params.stageWidth - params.assetWidth) / 2)
  const y = Math.round((params.stageHeight - params.assetHeight) / 2)
  return {
    x,
    y,
    scaleX: minScale,
    scaleY: minScale
  }
}

/**
 * Résout ou ajuste les coordonnées (x, y) et l'échelle (scaleX, scaleY) de l'arrière-plan.
 * Par défaut, initialise en cover sans bloquer les échelles inférieures ou supérieures
 * ni restreindre les translations.
 */
export function clampBackgroundCover(
  transform: { x?: number; y?: number; scaleX?: number; scaleY?: number },
  params: BackgroundCoverParams,
  options?: ClampBackgroundCoverOptions
): ClampedBackgroundTransform {
  const cover = computeBackgroundCoverTransform(params)

  if (!options?.strictClamp) {
    const rawScale = transform.scaleX ?? transform.scaleY ?? cover.scaleX
    return {
      x: transform.x !== undefined ? Math.round(transform.x) : cover.x,
      y: transform.y !== undefined ? Math.round(transform.y) : cover.y,
      scaleX: rawScale,
      scaleY: rawScale
    }
  }

  // Clamping strict (si explicitement requis)
  const minScale = computeCoverMinScale(params)
  const rawScale = transform.scaleX ?? transform.scaleY ?? cover.scaleX
  const scale = Math.max(minScale, rawScale)
  const renderedWidth = params.assetWidth * scale
  const renderedHeight = params.assetHeight * scale
  const minX = params.stageWidth - renderedWidth
  const maxX = 0
  const minY = params.stageHeight - renderedHeight
  const maxY = 0
  const rawX = transform.x ?? cover.x
  const rawY = transform.y ?? cover.y

  return {
    x: Math.round(Math.min(maxX, Math.max(minX, rawX))),
    y: Math.round(Math.min(maxY, Math.max(minY, rawY))),
    scaleX: scale,
    scaleY: scale
  }
}
