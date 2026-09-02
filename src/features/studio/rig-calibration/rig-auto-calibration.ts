import type { Asset, AssetCalibration, AssetCategory } from '@core/types/asset.types'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import {
  findAlphaContentBounds,
  type AlphaContentBounds
} from '@/features/asset-manager/engine/alpha-content-bounds'

export interface RigCanvasProfile {
  canvasWidth: number
  canvasHeight: number
}

interface CategoryTarget {
  maxWidth: number
  maxHeight: number
  anchorX: number
  anchorY: number
  pivotX: number
  pivotY: number
}

const TARGETS: Partial<Record<AssetCategory, CategoryTarget>> = {
  body: { maxWidth: 0.92, maxHeight: 0.92, anchorX: 0.5, anchorY: 0.97, pivotX: 0.5, pivotY: 1 },
  head: { maxWidth: 0.75, maxHeight: 0.60, anchorX: 0.5, anchorY: 0.18, pivotX: 0.5, pivotY: 0.94 }
}

export function computeSuggestedRigCalibration(
  asset: Pick<Asset, 'width' | 'height' | 'category'>,
  bounds: AlphaContentBounds,
  profile: RigCanvasProfile
): AssetCalibration {
  if (asset.width === profile.canvasWidth && asset.height === profile.canvasHeight) {
    return { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
  }

  const target = TARGETS[asset.category] ?? TARGETS.body!
  const maxWidth = profile.canvasWidth * target.maxWidth
  const maxHeight = profile.canvasHeight * target.maxHeight
  const scale = Math.min(maxWidth / bounds.width, maxHeight / bounds.height)
  const sourceAnchorX = bounds.x + bounds.width * target.pivotX
  const sourceAnchorY = bounds.y + bounds.height * target.pivotY
  return {
    x: Math.round(profile.canvasWidth * target.anchorX - sourceAnchorX * scale),
    y: Math.round(profile.canvasHeight * target.anchorY - sourceAnchorY * scale),
    scaleX: Number(scale.toFixed(4)),
    scaleY: Number(scale.toFixed(4)),
    rotation: 0
  }
}

async function readAlphaBounds(blob: Blob): Promise<AlphaContentBounds> {
  const bitmap = await createImageBitmap(blob)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error("Impossible d'analyser le sprite.")
    context.drawImage(bitmap, 0, 0)
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data
    return (
      findAlphaContentBounds(pixels, bitmap.width, bitmap.height) ?? {
        x: 0,
        y: 0,
        width: bitmap.width,
        height: bitmap.height
      }
    )
  } finally {
    bitmap.close()
  }
}

export async function suggestRigCalibration(
  asset: Asset,
  profile: RigCanvasProfile
): Promise<AssetCalibration> {
  const blob = await assetRepository.getBlob(asset.blobId)
  if (!blob) throw new Error('Image du sprite introuvable.')
  const bounds = await readAlphaBounds(blob)
  return computeSuggestedRigCalibration(asset, bounds, profile)
}
