import type { DeskSplitConfig, NormalizedPoint } from '@core/types/asset.types'

export interface DeskSplitPoint {
  x: number
  y: number
}

type Point2D = DeskSplitPoint

/**
 * Valide si une configuration de découpe de bureau est utilisable.
 */
export function isSplitConfigValid(config?: DeskSplitConfig | null): boolean {
  if (!config || !config.enabled) return false
  if (!Array.isArray(config.cutline) || config.cutline.length < 2) return false
  return config.cutline.every(
    (pt) =>
      Number.isFinite(pt.x) &&
      Number.isFinite(pt.y) &&
      pt.x >= -0.1 &&
      pt.x <= 1.1 &&
      pt.y >= -0.1 &&
      pt.y <= 1.1
  )
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/**
 * Interpolation de spline Catmull-Rom pour adoucir la ligne de coupe.
 */
export function interpolateSpline(
  points: Point2D[],
  tension: number = 0.5,
  segmentsPerSpan: number = 8
): Point2D[] {
  if (points.length < 3) return points.map((p) => ({ ...p }))

  const result: Point2D[] = []
  const pts = [points[0], ...points, points[points.length - 1]]

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2]

    for (let t = 0; t < segmentsPerSpan; t++) {
      const u = t / segmentsPerSpan
      const u2 = u * u
      const u3 = u2 * u

      // Catmull-Rom Hermite basis
      const b0 = -tension * u3 + 2 * tension * u2 - tension * u
      const b1 = (2 - tension) * u3 + (tension - 3) * u2 + 1
      const b2 = (tension - 2) * u3 + (3 - 2 * tension) * u2 + tension * u
      const b3 = tension * u3 - tension * u2

      const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x
      const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y

      result.push({ x, y })
    }
  }

  result.push({ ...points[points.length - 1] })
  return result
}

export interface SplitPolygons {
  /** Polygone de la tranche supérieure (arrière-plan du bureau, derrière le sujet) */
  backPolygon: Point2D[]
  /** Polygone de la tranche inférieure (premier plan du bureau, devant le sujet) */
  frontPolygon: Point2D[]
  /** Ligne de découpe en pixels locaux */
  cutPixels: Point2D[]
}

/**
 * Construit les 2 polygones fermés de découpage (haut/arrière et bas/avant)
 * à partir d'une liste de points normalisés [0..1] et des dimensions de l'asset.
 */
export function buildSplitPolygons(
  cutline: NormalizedPoint[],
  width: number,
  height: number,
  options: { smoothness?: number } = {}
): SplitPolygons {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)

  if (!Array.isArray(cutline) || cutline.length === 0) {
    const fallbackHalf: Point2D[] = [
      { x: 0, y: safeHeight * 0.5 },
      { x: safeWidth, y: safeHeight * 0.5 }
    ]
    return {
      backPolygon: [
        { x: 0, y: 0 },
        { x: 0, y: safeHeight * 0.5 },
        { x: safeWidth, y: safeHeight * 0.5 },
        { x: safeWidth, y: 0 }
      ],
      frontPolygon: [
        { x: 0, y: safeHeight },
        { x: 0, y: safeHeight * 0.5 },
        { x: safeWidth, y: safeHeight * 0.5 },
        { x: safeWidth, y: safeHeight }
      ],
      cutPixels: fallbackHalf
    }
  }

  // 1. Clamper et ordonner les points par X croissant
  const sanitized = cutline
    .map((pt) => ({ x: clamp01(pt.x), y: clamp01(pt.y) }))
    .sort((a, b) => a.x - b.x)

  // 2. Étendre aux bords gauche (x=0) et droit (x=1) si nécessaire
  const extended: NormalizedPoint[] = []
  if (sanitized[0].x > 0.001) {
    extended.push({ x: 0, y: sanitized[0].y })
  }
  extended.push(...sanitized)
  if (sanitized[sanitized.length - 1].x < 0.999) {
    extended.push({ x: 1, y: sanitized[sanitized.length - 1].y })
  }

  // 3. Convertir en pixels locaux de l'asset
  let pixelCutline: Point2D[] = extended.map((pt) => ({
    x: Math.round(pt.x * safeWidth * 100) / 100,
    y: Math.round(pt.y * safeHeight * 100) / 100
  }))

  // 4. Lissage optionnel par spline si demandé
  const smoothness = options.smoothness ?? 0
  if (smoothness > 0 && pixelCutline.length >= 3) {
    pixelCutline = interpolateSpline(pixelCutline, Math.min(1, smoothness), 8)
  }

  // 5. Générer le polygone Haut / Arrière (Back)
  // Coin haut-gauche (0, 0) -> suite des points de coupe -> Coin haut-droit (width, 0)
  const backPolygon: Point2D[] = [
    { x: 0, y: 0 },
    ...pixelCutline,
    { x: safeWidth, y: 0 }
  ]

  // 6. Générer le polygone Bas / Avant (Front)
  // Coin bas-gauche (0, height) -> suite des points de coupe -> Coin bas-droit (width, height)
  const frontPolygon: Point2D[] = [
    { x: 0, y: safeHeight },
    ...pixelCutline,
    { x: safeWidth, y: safeHeight }
  ]

  return {
    backPolygon,
    frontPolygon,
    cutPixels: pixelCutline
  }
}
