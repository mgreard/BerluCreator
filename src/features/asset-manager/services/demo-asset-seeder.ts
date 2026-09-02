import type {
  Asset,
  AssetCategory,
  CharacterAssetMetadata,
  CharacterPropSlot
} from '@core/types/asset.types'
import { CHARACTER_PROP_SLOTS, isAssetCategory } from '@core/types/asset.types'
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
    img.onerror = (error) => {
      URL.revokeObjectURL(url)
      reject(error)
    }
    img.src = url
  })
}

function bundledPath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/')
  const marker = '/assets/sprites/'
  const index = normalized.indexOf(marker)
  return index >= 0 ? normalized.slice(index + marker.length) : normalized
}

export const PERSO_FAMILY_MANIFEST = [
  { key: 'berleak', name: 'Berleak', pattern: /^berleak/i },
  { key: 'pedro-1', name: 'Pedro 1', pattern: /^pedro1/i },
  { key: 'pedro-2', name: 'Pedro 2', pattern: /^pedro2/i },
  { key: 'moman', name: 'Moman', pattern: /^moman/i }
] as const

function characterFamily(fileName: string): CharacterAssetMetadata {
  const value = fileName.toLowerCase()
  const family = PERSO_FAMILY_MANIFEST.find((entry) => entry.pattern.test(value))
  if (family) return { key: family.key, name: family.name, form: 'full' }
  const key = fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return { key, name: fileName.replace(/[_-]+/g, ' '), form: 'full' }
}

export interface BundledSpriteMetadata {
  name: string
  category: AssetCategory
  tags: string[]
  sourcePath: string
  headSeriesId?: string
  characterPropSlot?: CharacterPropSlot
  character?: CharacterAssetMetadata
}

export function parseSpriteMetadata(filePath: string): BundledSpriteMetadata | null {
  const sourcePath = bundledPath(filePath)
  const parts = sourcePath.split('/').filter(Boolean)
  if (parts.length < 2) return null
  const root = parts[0]
  if (!isAssetCategory(root)) return null
  const fileName = parts.at(-1)!.replace(/\.(png|jpe?g|webp|svg)$/i, '')
  const name = fileName.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim()
  const tags: string[] = [root]
  let headSeriesId: string | undefined
  let characterPropSlot: CharacterPropSlot | undefined
  let character: CharacterAssetMetadata | undefined

  if (root === 'head' || root === 'mouth') {
    headSeriesId = parts.length >= 3 ? parts[1] : 'berlu'
    tags.push(headSeriesId)
    character = { key: headSeriesId, name: headSeriesId === 'berlu' ? 'Berlu' : headSeriesId, form: 'rig' }
  } else if (root === 'body') {
    const key = parts.length >= 3 ? parts[1] : 'berlu'
    character = { key, name: key === 'berlu' ? 'Berlu' : key, form: 'rig' }
  } else if (root === 'perso') {
    character = characterFamily(fileName)
  } else if (root === 'props_character') {
    const slot = parts.length >= 3 ? parts[1] : undefined
    if (!slot || !CHARACTER_PROP_SLOTS.includes(slot as CharacterPropSlot)) return null
    characterPropSlot = slot as CharacterPropSlot
    tags.push(characterPropSlot)
  }

  return {
    name,
    category: root,
    tags,
    sourcePath,
    headSeriesId,
    characterPropSlot,
    character
  }
}

function assetIdentity(asset: Pick<Asset, 'category' | 'name'>): string {
  return `${asset.category}:${asset.name.trim().toLocaleLowerCase('fr')}`
}

export function findMissingBundledSpritePaths(
  paths: string[],
  existing: Array<Pick<Asset, 'name' | 'category' | 'sourcePath' | 'source'>>
): string[] {
  const existingPaths = new Set(existing.map((asset) => asset.sourcePath).filter(Boolean))
  const legacyIdentities = new Set(
    existing
      .filter((asset) => asset.source !== 'uploaded' && !asset.sourcePath)
      .map(assetIdentity)
  )
  return paths.filter((path) => {
    const metadata = parseSpriteMetadata(path)
    if (!metadata) return false
    if (existingPaths.has(metadata.sourcePath)) return false
    return !legacyIdentities.has(assetIdentity(metadata))
  })
}

export async function cleanupObsoleteAndDuplicateAssets(validBundledPaths?: Set<string>): Promise<void> {
  const allAssets = await assetRepository.getAll()
  const seen = new Set<string>()
  for (const asset of allAssets) {
    if (!isAssetCategory(asset.category)) {
      await assetRepository.delete(asset.id)
      continue
    }
    // Les imports utilisateur ne sont jamais réconciliés ni dédoublonnés automatiquement.
    if (asset.source === 'uploaded') continue
    if (
      asset.source === 'bundled' &&
      asset.sourcePath &&
      validBundledPaths &&
      !validBundledPaths.has(asset.sourcePath)
    ) {
      await assetRepository.delete(asset.id)
      continue
    }
    const identity = asset.sourcePath ? `path:${asset.sourcePath}` : assetIdentity(asset)
    if (seen.has(identity)) await assetRepository.delete(asset.id)
    else seen.add(identity)
  }
}

export async function syncBundledDemoAssets(): Promise<void> {
  const spriteModules = import.meta.glob<string>(
    '@/assets/sprites/**/*.{png,PNG,jpg,JPG,jpeg,JPEG,webp,WEBP,svg,SVG}',
    { eager: true, import: 'default' }
  )
  const metadataByPath = new Map<string, BundledSpriteMetadata>()
  for (const path of Object.keys(spriteModules)) {
    const metadata = parseSpriteMetadata(path)
    if (metadata) metadataByPath.set(path, metadata)
  }
  await cleanupObsoleteAndDuplicateAssets(
    new Set([...metadataByPath.values()].map((metadata) => metadata.sourcePath))
  )

  const existing = await assetRepository.getAll()
  const missing = new Set(findMissingBundledSpritePaths([...metadataByPath.keys()], existing))
  for (const [path, url] of Object.entries(spriteModules)) {
    if (!missing.has(path)) continue
    const metadata = metadataByPath.get(path)
    if (!metadata) continue
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const dimensions = await getImageDimensions(blob)
      const spriteConfig = resolveSpriteConfig(metadata.name, metadata.category)
      const now = Date.now()
      const asset: Asset = {
        id: generateId(`asset_${metadata.category}`),
        name: metadata.name,
        category: metadata.category,
        tags: metadata.tags,
        blobId: generateId('blob'),
        width: dimensions.width,
        height: dimensions.height,
        source: 'bundled',
        sourcePath: metadata.sourcePath,
        headSeriesId: metadata.headSeriesId,
        characterPropSlot: metadata.characterPropSlot,
        character: metadata.character,
        isMovable: spriteConfig.isMovable,
        createdAt: now,
        updatedAt: now
      }
      await assetRepository.create(asset, blob)
    } catch (error) {
      console.error(`Erreur chargement sprite ${path}:`, error)
    }
  }
}

export const syncBundledAssets = syncBundledDemoAssets
