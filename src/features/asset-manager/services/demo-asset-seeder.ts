import type { Asset, AssetCategory } from '@core/types/asset.types'
import { isAssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { resolveSpriteConfig } from '@core/constants/sprites-config'
import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import { generateId } from '@/lib/utils'

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

/**
 * Nettoie les catégories obsolètes et déduplique la base de données locale.
 */
export async function cleanupObsoleteAndDuplicateAssets(): Promise<void> {
  const allAssets = await assetRepository.getAll()
  const seenIdentities = new Map<string, Asset>()

  for (const asset of allAssets) {
    // 1. Supprimer les catégories obsolètes (ex: mouth, arms_left, arms_right)
    if (!isAssetCategory(asset.category)) {
      await assetRepository.delete(asset.id)
      continue
    }

    // 2. Dédupliquer par identité (catégorie + nom normalisé)
    const identity = spriteIdentity(asset.name, asset.category)
    if (seenIdentities.has(identity)) {
      // Déjà présent : supprimer le doublon
      await assetRepository.delete(asset.id)
    } else {
      seenIdentities.set(identity, asset)
    }
  }
}

export async function syncBundledDemoAssets(force = false): Promise<void> {
  const spriteModules = import.meta.glob<string>(
    '@/assets/sprites/**/*.{png,PNG}',
    {
      eager: true,
      import: 'default'
    }
  )

  // 1. Assainir la base de données : supprimer doublons et catégories obsolètes
  await cleanupObsoleteAndDuplicateAssets()

  // 2. Identifier les sprites manquants
  const existing = await assetRepository.getAll()
  const missingPaths = new Set(
    findMissingBundledSpritePaths(Object.keys(spriteModules), existing)
  )

  const registeredIdentities = new Set(
    existing.map((asset) => spriteIdentity(asset.name, asset.category))
  )

  for (const [path, url] of Object.entries(spriteModules)) {
    if (!missingPaths.has(path)) continue
    try {
      const metadata = parseSpriteMetadata(path)
      if (!metadata) continue
      const { name, category, tags } = metadata
      const identity = spriteIdentity(name, category)

      // Éviter toute insertion en double dans la même boucle
      if (registeredIdentities.has(identity)) continue
      registeredIdentities.add(identity)

      const response = await fetch(url)
      const blob = await response.blob()
      const dimensions = await getImageDimensions(blob)
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
        character:
          ASSET_CATEGORIES[category]?.placementMode === 'character-anchored'
            ? { key: 'berlu', name: 'Berlu', form: 'rig' }
            : undefined,
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

export const syncBundledAssets = syncBundledDemoAssets

function spriteIdentity(name: string, category: AssetCategory): string {
  return `${category}:${name.trim().toLocaleLowerCase('fr')}`
}

export function findMissingBundledSpritePaths(
  paths: string[],
  existing: Array<Pick<Asset, 'name' | 'category'>>
): string[] {
  const existingIdentities = new Set(
    existing.map((asset) => spriteIdentity(asset.name, asset.category))
  )
  const missing: string[] = []
  for (const path of paths) {
    const metadata = parseSpriteMetadata(path)
    if (!metadata) continue
    const identity = spriteIdentity(metadata.name, metadata.category)
    if (existingIdentities.has(identity)) continue
    existingIdentities.add(identity)
    missing.push(path)
  }
  return missing
}

export function parseSpriteMetadata(filePath: string): {
  name: string
  category: AssetCategory
  tags: string[]
} | null {
  const parts = filePath.replace(/\\/g, '/').split('/')
  const fileName = parts[parts.length - 1].replace(/\.png$/i, '')
  const folder = parts[parts.length - 2]

  // Ignorer les dossiers obsolètes
  if (folder === 'arms' || folder === 'mouth') {
    return null
  }

  let category: AssetCategory
  const tags: string[] = [folder]

  const formattedName = fileName
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()

  if (folder === 'head') {
    category = 'head'
    tags.push('head', 'visage', 'expression', 'berlu')
  } else if (folder === 'torso') {
    category = 'body'
    tags.push('body', 'corps', 'berlu')
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
    return null
  }

  return { name: formattedName, category, tags }
}
