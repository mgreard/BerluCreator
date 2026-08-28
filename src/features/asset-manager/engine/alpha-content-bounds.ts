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
