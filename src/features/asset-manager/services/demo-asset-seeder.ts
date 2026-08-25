import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { resolveSpriteConfig } from '@core/constants/sprites-config'
import { generateId } from '@/lib/utils'

// Import eager de tous les sprites PNG du dossier assets
const spriteModules = import.meta.glob<string>('@/assets/sprites/**/*.png', {
  eager: true,
  import: 'default'
})

/**
 * Charge l'ensemble des sprites réels du studio dans la base locale Dexie
 * et nettoie les anciens placeholders vectoriels s'ils existent.
 */
export async function seedDemoAssetsIfEmpty(force = false): Promise<void> {
  const existing = await assetRepository.getAll()

  // Détecter si la base contient les anciens placeholders SVG vectoriels ou s'il manque isMovable
  const hasOldPlaceholders = existing.some(
    (a) => a.id.startsWith('asset_backdrop') || a.id.startsWith('asset_torso') || a.isMovable === undefined
  )

  if (!force && existing.length > 0 && !hasOldPlaceholders) {
    return
  }

  // Nettoyer les anciens assets si placeholders ou forçage
  if (hasOldPlaceholders || force) {
    for (const old of existing) {
      await assetRepository.delete(old.id)
    }
  }

  // Importer chaque sprite PNG détecté par Vite
  for (const [path, url] of Object.entries(spriteModules)) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const dimensions = await getBlobDimensions(blob)
      const { name, category, tags } = parseSpriteMetadata(path)
      const spriteConfig = resolveSpriteConfig(name, category)

      const assetId = generateId(`asset_${category}`)
      const blobId = generateId('blob')

      const asset: Asset = {
        id: assetId,
        name,
        category,
        tags,
        blobId,
        width: dimensions.width,
        height: dimensions.height,
        anchors: [],
        isMovable: spriteConfig.isMovable,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      await assetRepository.create(asset, blob)
    } catch (err) {
      console.error(`Erreur chargement sprite ${path}:`, err)
    }
  }
}

function parseSpriteMetadata(filePath: string): {
  name: string
  category: AssetCategory
  tags: string[]
} {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts[parts.length - 1].replace(/\.png$/i, '')
  const folder = parts[parts.length - 2]

  let category: AssetCategory = 'props'
  const tags: string[] = [folder]

  // Formater un nom propre lisible (ex: "Bras_baisse_droit" -> "Bras Baissé Droit")
  const formattedName = fileName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

  if (folder === 'arms') {
    if (fileName.toLowerCase().includes('gauche')) {
      category = 'arms_left'
      tags.push('arms_left', 'bras')
    } else {
      category = 'arms_right'
      tags.push('arms_right', 'bras')
    }
  } else if (folder === 'head') {
    category = 'head'
    tags.push('head', 'visage', 'expression')
  } else if (folder === 'mouth') {
    category = 'mouth'
    tags.push('mouth', 'bouche', 'phoneme')
  } else if (folder === 'torse') {
    category = 'torso'
    tags.push('torso', 'corps')
  } else if (folder === 'plateau') {
    if (fileName.toLowerCase().startsWith('fond')) {
      category = 'backdrop'
      tags.push('backdrop', 'decor', 'fond')
    } else if (
      fileName.toLowerCase().startsWith('atmo') ||
      fileName.toLowerCase().startsWith('light')
    ) {
      category = 'overlay'
      tags.push('overlay', 'ambiance', 'lumiere')
    } else {
      category = 'props'
      tags.push('props', 'plateau', 'bureau')
    }
  } else if (folder === 'items') {
    if (fileName.toLowerCase().startsWith('eyes')) {
      category = 'eyes'
      tags.push('eyes', 'regard', 'yeux')
    } else {
      category = 'props'
      tags.push('props', 'accessoire')
    }
  } else if (folder === 'items-desk') {
    category = 'props'
    tags.push('props', 'bureau', 'objet')
  }

  return { name: formattedName, category, tags }
}

function getBlobDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: 840, height: 908 })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}
