import type { BodyRigPreset } from '@core/types/asset.types'

export interface AlphaContentBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface AlphaBoundsOptions {
  alphaThreshold?: number
  outlierFraction?: number
}

function findLowerBound(histogram: Uint32Array, trimBudget: number): number {
  let accumulated = 0
  for (let index = 0; index < histogram.length; index += 1) {
    accumulated += histogram[index]
    if (accumulated > trimBudget) return index
  }
  return 0
}

function findUpperBound(histogram: Uint32Array, trimBudget: number): number {
  let accumulated = 0
  for (let index = histogram.length - 1; index >= 0; index -= 1) {
    accumulated += histogram[index]
    if (accumulated > trimBudget) return index
  }
  return histogram.length - 1
}

/**
 * Calcule les limites du contenu alpha significatif d'une image RGBA.
 * Une très petite fraction de la masse opaque est ignorée sur chaque bord afin
 * que des pixels parasites isolés ne réduisent pas la lisibilité de la miniature.
 */
export function findAlphaContentBounds(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  options: AlphaBoundsOptions = {}
): AlphaContentBounds | null {
  if (width <= 0 || height <= 0 || pixels.length < width * height * 4) return null

  const alphaThreshold = Math.max(0, Math.min(255, options.alphaThreshold ?? 8))
  const outlierFraction = Math.max(0, Math.min(0.1, options.outlierFraction ?? 0.001))
  const columns = new Uint32Array(width)
  const rows = new Uint32Array(height)
  let opaquePixelCount = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = pixels[(y * width + x) * 4 + 3]
      if (alpha < alphaThreshold) continue
      columns[x] += 1
      rows[y] += 1
      opaquePixelCount += 1
    }
  }

  if (opaquePixelCount === 0) return null

  const trimBudget = Math.floor(opaquePixelCount * outlierFraction)
  const left = findLowerBound(columns, trimBudget)
  const right = findUpperBound(columns, trimBudget)
  const top = findLowerBound(rows, trimBudget)
  const bottom = findUpperBound(rows, trimBudget)

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1
  }
}

/**
 * Déduit l'origine d'un rig de corps en cherchant le premier segment opaque
 * stable au centre du sprite, juste sous l'ouverture transparente du cou.
 */
export function inferBodyRigPreset(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): BodyRigPreset {
  const bounds = findAlphaContentBounds(pixels, width, height) ?? {
    x: 0,
    y: 0,
    width: Math.max(1, width),
    height: Math.max(1, height)
  }
  const torsoStartY = Math.round(bounds.y + bounds.height * 0.18)
  const torsoEndY = Math.round(bounds.y + bounds.height * 0.58)
  let weightedTorsoX = 0
  let torsoWeight = 0
  for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
    let opaquePixels = 0
    for (let y = torsoStartY; y <= torsoEndY; y += 1) {
      if ((pixels[(y * width + x) * 4 + 3] ?? 0) >= 32) opaquePixels += 1
    }
    const columnWeight = opaquePixels * opaquePixels
    weightedTorsoX += x * columnWeight
    torsoWeight += columnWeight
  }
  const neckX = Math.round(
    torsoWeight > 0 ? weightedTorsoX / torsoWeight : bounds.x + bounds.width / 2
  )
  const bandHalfWidth = Math.max(2, Math.round(bounds.width * 0.04))
  const bandStart = Math.max(bounds.x, neckX - bandHalfWidth)
  const bandEnd = Math.min(bounds.x + bounds.width - 1, neckX + bandHalfWidth)
  const bandWidth = Math.max(1, bandEnd - bandStart + 1)
  const minimumOpaquePixels = Math.max(1, Math.ceil(bandWidth * 0.18))
  const scanEnd = Math.min(
    bounds.y + bounds.height - 1,
    bounds.y + Math.round(bounds.height * 0.3)
  )
  let consecutiveOpaqueRows = 0
  let neckY = Math.round(bounds.y + bounds.height * 0.12)

  for (let y = bounds.y; y <= scanEnd; y += 1) {
    let opaquePixels = 0
    for (let x = bandStart; x <= bandEnd; x += 1) {
      if ((pixels[(y * width + x) * 4 + 3] ?? 0) >= 8) opaquePixels += 1
    }
    consecutiveOpaqueRows = opaquePixels >= minimumOpaquePixels
      ? consecutiveOpaqueRows + 1
      : 0
    if (consecutiveOpaqueRows >= 3) {
      neckY = y - consecutiveOpaqueRows + 1
      break
    }
  }

  return {
    neckAnchor: { x: neckX, y: neckY },
    headMotionRadius: Math.max(8, Math.round(bounds.height * 0.06))
  }
}

export async function analyzeBodyRigPreset(blob: Blob): Promise<BodyRigPreset | undefined> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return undefined
  const bitmap = await createImageBitmap(blob)
  try {
    const maxAnalysisSize = 640
    const scale = Math.min(1, maxAnalysisSize / Math.max(bitmap.width, bitmap.height))
    const analysisWidth = Math.max(1, Math.round(bitmap.width * scale))
    const analysisHeight = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = analysisWidth
    canvas.height = analysisHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return undefined
    context.drawImage(bitmap, 0, 0, analysisWidth, analysisHeight)
    const pixels = context.getImageData(0, 0, analysisWidth, analysisHeight).data
    const preset = inferBodyRigPreset(pixels, analysisWidth, analysisHeight)
    const scaleX = bitmap.width / analysisWidth
    const scaleY = bitmap.height / analysisHeight
    return {
      neckAnchor: {
        x: Math.round(preset.neckAnchor.x * scaleX),
        y: Math.round(preset.neckAnchor.y * scaleY)
      },
      headMotionRadius: Math.max(8, Math.round(preset.headMotionRadius * scaleY))
    }
  } finally {
    bitmap.close()
  }
}
