import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import {
  isAssetCategory,
  type Asset,
  type AssetCategory
} from '@core/types/asset.types'
import { resolveSpriteConfig } from '@core/constants/sprites-config'
import { generateId } from '@/lib/utils'

// Import eager de tous les sprites PNG du dossier assets
const spriteModules = import.meta.glob<string>('@/assets/sprites/**/*.png', {
  eager: true,
  import: 'default'
})

async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de lire les dimensions du sprite.'))
    }
    img.src = url
  })
}

/**
 * Charge l'ensemble des sprites réels du studio dans la base locale Dexie
 * avec leurs dimensions natives, sans recadrage transparent.
 */
export async function seedDemoAssetsIfEmpty(force = false): Promise<void> {
  const existing = await assetRepository.getAll()

  const needsSpritePackMigration = existing.some(
    (asset) => !isAssetCategory(asset.category) || asset.isMovable === undefined
  )

  if (!force && existing.length > 0 && !needsSpritePackMigration) {
    return
  }

  // Nettoyer les anciens assets si leur structure est obsolète ou en cas de forçage.
  if (needsSpritePackMigration || force) {
    for (const old of existing) {
      await assetRepository.delete(old.id)
    }
  }

  // Importer chaque sprite PNG détecté par Vite
  for (const [path, url] of Object.entries(spriteModules)) {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const dimensions = await getImageDimensions(blob)
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
        displayWidth: dimensions.width,
        displayHeight: dimensions.height,
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

export function parseSpriteMetadata(filePath: string): {
  name: string
  category: AssetCategory
  tags: string[]
} {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts[parts.length - 1].replace(/\.png$/i, '')
  const folder = parts[parts.length - 2]

  let category: AssetCategory
  const tags: string[] = [folder]

  // Formater un nom propre lisible (ex: "Bras_baisse_droit" -> "Bras Baissé Droit")
  const formattedName = fileName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

  if (folder === 'arms') {
    const normalizedFileName = fileName.toLowerCase()
    if (normalizedFileName.includes('_left_arm')) {
      category = 'arms_left'
      tags.push('arms_left', 'bras', 'berlu')
    } else if (
      normalizedFileName.includes('_right_arm') ||
      normalizedFileName.includes('_both_arms')
    ) {
      category = 'arms_right'
      tags.push('arms_right', 'bras', 'berlu')
    } else {
      throw new Error(`Nom de sprite de bras non reconnu : ${fileName}`)
    }
  } else if (folder === 'head') {
    category = 'head'
    tags.push('head', 'visage', 'expression', 'berlu')
  } else if (folder === 'mouth') {
    category = 'mouth'
    tags.push('mouth', 'bouche', 'phoneme', 'berlu')
  } else if (folder === 'torso') {
    category = 'torso'
    tags.push('torso', 'corps', 'berlu')
  } else if (folder === 'background') {
    category = 'background'
    tags.push('background', 'fond')
  } else if (folder === 'desk') {
    category = 'desk'
    tags.push('desk', 'bureau')
  } else if (folder === 'eyes') {
    category = 'eyes'
    tags.push('eyes', 'regard', 'lunettes', 'berlu')
  } else if (folder === 'props-host') {
    category = 'props_host'
    tags.push('props_host', 'presentateur', 'accessoire', 'berlu')
  } else if (folder === 'props-set') {
    category = 'props_set'
    tags.push('props_set', 'plateau', 'objet')
  } else if (folder === 'props-desk') {
    category = 'props_desk'
    tags.push('props_desk', 'bureau', 'objet')
  } else if (folder === 'foreground') {
    category = 'foreground'
    tags.push('foreground', 'premier-plan', 'ambiance')
  } else {
    throw new Error(`Dossier de sprites non reconnu : ${folder}`)
  }

  return { name: formattedName, category, tags }
}
