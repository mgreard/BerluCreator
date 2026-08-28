import type { Asset, AssetCalibration, AssetCategory } from '@core/types/asset.types'
import {
  RIG_CATALOG_SCHEMA,
  RIG_CATALOG_VERSION,
  RIG_CONFIGURABLE_CATEGORIES,
  RIG_SLOT_CATEGORIES,
  type RigAssetIdentity,
  type RigCatalogFile,
  type RigCategoryDefinition,
  type RigConfigurableCategory,
  type RigDefinition,
  type RigPartDefinition,
  type RigSlotCategory
} from './rig-catalog.types'

export const DEFAULT_RIG_CANVAS = { width: 840, height: 908 } as const

export function isRigSlotCategory(category: AssetCategory): category is RigSlotCategory {
  return RIG_SLOT_CATEGORIES.includes(category as RigSlotCategory)
}

export function isRigConfigurableCategory(
  category: AssetCategory
): category is RigConfigurableCategory {
  return RIG_CONFIGURABLE_CATEGORIES.includes(category as RigConfigurableCategory)
}

export function rigAssetIdentity(
  asset: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): RigAssetIdentity {
  if (!isRigSlotCategory(asset.category)) {
    throw new Error(`Catégorie non prise en charge par un rig : ${asset.category}`)
  }
  return {
    name: asset.name,
    category: asset.category,
    width: asset.width,
    height: asset.height
  }
}

export function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase('fr')
}

export function rigAssetKey(identity: RigAssetIdentity): string {
  return `${identity.category}:${normalizedName(identity.name)}:${identity.width}x${identity.height}`
}

export function assetsShareRigIdentity(
  left: RigAssetIdentity,
  right: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): boolean {
  return (
    left.category === right.category &&
    normalizedName(left.name) === normalizedName(right.name) &&
    left.width === right.width &&
    left.height === right.height
  )
}

export function findAssetByRigIdentity(
  identity: RigAssetIdentity,
  assets: Asset[]
): Asset | undefined {
  return assets.find((asset) => assetsShareRigIdentity(identity, asset))
}

export function slugify(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'rig'
  )
}

export function createRigId(characterKey: string, body: RigAssetIdentity): string {
  return `rig-${slugify(characterKey)}-${slugify(body.name)}-${body.width}x${body.height}`
}

export function identityCalibration(asset?: Pick<Asset, 'calibration'>): AssetCalibration {
  return {
    x: asset?.calibration?.x ?? 0,
    y: asset?.calibration?.y ?? 0,
    scaleX: asset?.calibration?.scaleX ?? 1,
    scaleY: asset?.calibration?.scaleY ?? 1,
    rotation: asset?.calibration?.rotation ?? 0,
    zIndex: asset?.calibration?.zIndex
  }
}

export function areCalibrationsEquivalent(
  left?: AssetCalibration | null,
  right?: AssetCalibration | null,
  tolerance = 0.001
): boolean {
  if (!left && !right) return true
  if (!left || !right) return false
  return (
    Math.abs(left.x - right.x) <= tolerance &&
    Math.abs(left.y - right.y) <= tolerance &&
    Math.abs(left.scaleX - right.scaleX) <= tolerance &&
    Math.abs(left.scaleY - right.scaleY) <= tolerance &&
    Math.abs((left.rotation ?? 0) - (right.rotation ?? 0)) <= tolerance &&
    (left.zIndex ?? undefined) === (right.zIndex ?? undefined)
  )
}

export function effectiveCalibration(
  rig: RigDefinition,
  part: RigPartDefinition,
  asset?: Asset
): AssetCalibration | null {
  if (part.asset.category === 'body') {
    return { ...rig.bodyCalibration }
  }
  const category = rig.categories.find((candidate) => candidate.category === part.asset.category)
  if (!category?.enabled) return null
  return (
    part.calibrationOverride ??
    category.template ??
    (asset ? identityCalibration(asset) : { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 })
  )
}

export function createDefaultCategories(): RigCategoryDefinition[] {
  return RIG_CONFIGURABLE_CATEGORIES.map((category) => ({
    category,
    enabled: true
  }))
}

export function createRigDefinition(bodyAsset: Asset, characterAssets: Asset[]): RigDefinition {
  const body = rigAssetIdentity(bodyAsset)
  const bodyCalibration = identityCalibration(bodyAsset)
  const categories: RigCategoryDefinition[] = createDefaultCategories()
  const parts: RigPartDefinition[] = []

  for (const categoryDef of categories) {
    const matchingAssets = characterAssets.filter(
      (asset) => asset.category === categoryDef.category
    )
    if (matchingAssets.length > 0) {
      const firstAsset = matchingAssets[0]
      const firstIdentity = rigAssetIdentity(firstAsset)
      categoryDef.template = identityCalibration(firstAsset)
      categoryDef.defaultPartKey = rigAssetKey(firstIdentity)

      for (const asset of matchingAssets) {
        const assetIdentity = rigAssetIdentity(asset)
        const calibration = identityCalibration(asset)
        const isOverride = !areCalibrationsEquivalent(calibration, categoryDef.template)
        parts.push({
          asset: assetIdentity,
          calibrationOverride: isOverride ? calibration : undefined
        })
      }
    }
  }

  return {
    id: createRigId(bodyAsset.character?.key ?? 'berlu', body),
    name: bodyAsset.name,
    characterKey: bodyAsset.character?.key ?? 'berlu',
    characterName: bodyAsset.character?.name ?? 'Berlu',
    canvasWidth: DEFAULT_RIG_CANVAS.width,
    canvasHeight: DEFAULT_RIG_CANVAS.height,
    body,
    bodyCalibration,
    categories,
    parts,
    excludedPartKeys: [],
    updatedAt: Date.now()
  }
}

export function defaultPartsForRig(rig: RigDefinition): RigPartDefinition[] {
  const defaults: RigPartDefinition[] = []
  for (const cat of rig.categories) {
    if (!cat.enabled || !cat.defaultPartKey) continue
    const part = rig.parts.find((p) => rigAssetKey(p.asset) === cat.defaultPartKey)
    if (part) defaults.push(part)
  }
  return defaults
}

export function selectedPartForCategory(
  rig: RigDefinition,
  category: RigConfigurableCategory
): RigPartDefinition | undefined {
  const cat = rig.categories.find((c) => c.category === category)
  if (!cat?.enabled || !cat.defaultPartKey) return undefined
  return rig.parts.find((p) => rigAssetKey(p.asset) === cat.defaultPartKey)
}

export function duplicateRigConfig(
  sourceRig: RigDefinition,
  targetRig: RigDefinition
): RigDefinition {
  return {
    ...targetRig,
    categories: JSON.parse(JSON.stringify(sourceRig.categories)) as RigCategoryDefinition[],
    parts: JSON.parse(JSON.stringify(sourceRig.parts)) as RigPartDefinition[],
    excludedPartKeys: [...sourceRig.excludedPartKeys],
    updatedAt: Date.now()
  }
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function parseCalibration(value: unknown): AssetCalibration | null {
  if (!value || typeof value !== 'object') return null
  const calibration = value as Partial<AssetCalibration>
  if (
    !finite(calibration.x) ||
    !finite(calibration.y) ||
    !finite(calibration.scaleX) ||
    !finite(calibration.scaleY)
  ) {
    return null
  }
  return {
    x: Math.round(calibration.x),
    y: Math.round(calibration.y),
    scaleX: Math.max(0.01, calibration.scaleX),
    scaleY: Math.max(0.01, calibration.scaleY),
    rotation: finite(calibration.rotation) ? calibration.rotation : 0,
    zIndex: finite(calibration.zIndex) ? Math.round(calibration.zIndex) : undefined
  }
}

export function parseIdentity(value: unknown): RigAssetIdentity | null {
  if (!value || typeof value !== 'object') return null
  const identity = value as Partial<RigAssetIdentity>
  if (
    typeof identity.name !== 'string' ||
    !identity.category ||
    !RIG_SLOT_CATEGORIES.includes(identity.category) ||
    !finite(identity.width) ||
    !finite(identity.height)
  ) {
    return null
  }
  return {
    name: identity.name,
    category: identity.category,
    width: Math.round(identity.width),
    height: Math.round(identity.height)
  }
}

function parseCategoryDefinition(value: unknown): RigCategoryDefinition | null {
  if (!value || typeof value !== 'object') return null
  const def = value as Partial<RigCategoryDefinition>
  if (
    !def.category ||
    !RIG_CONFIGURABLE_CATEGORIES.includes(def.category as RigConfigurableCategory)
  ) {
    return null
  }
  const category = def.category as RigConfigurableCategory
  const enabled = typeof def.enabled === 'boolean' ? def.enabled : true
  const template = def.template ? parseCalibration(def.template) ?? undefined : undefined
  const defaultPartKey = typeof def.defaultPartKey === 'string' ? def.defaultPartKey : undefined
  return { category, enabled, template, defaultPartKey }
}

function parsePartV3(value: unknown): RigPartDefinition | null {
  if (!value || typeof value !== 'object') return null
  const part = value as Partial<RigPartDefinition>
  const asset = parseIdentity(part.asset)
  if (!asset || asset.category === 'body') return null
  const calibrationOverride = part.calibrationOverride
    ? parseCalibration(part.calibrationOverride) ?? undefined
    : undefined
  return { asset, calibrationOverride }
}

export function parseRigV3(value: unknown): RigDefinition | null {
  if (!value || typeof value !== 'object') return null
  const rig = value as Partial<RigDefinition>
  const body = parseIdentity(rig.body)
  const bodyCalibration = parseCalibration(rig.bodyCalibration)
  if (
    typeof rig.id !== 'string' ||
    typeof rig.name !== 'string' ||
    typeof rig.characterKey !== 'string' ||
    typeof rig.characterName !== 'string' ||
    !finite(rig.canvasWidth) ||
    !finite(rig.canvasHeight) ||
    !body ||
    body.category !== 'body' ||
    !bodyCalibration
  ) {
    return null
  }

  const rawCategories = Array.isArray(rig.categories) ? rig.categories : []
  const parsedCategories = rawCategories
    .map(parseCategoryDefinition)
    .filter((cat): cat is RigCategoryDefinition => Boolean(cat))

  // Ensure all configurable categories exist
  const categories: RigCategoryDefinition[] = RIG_CONFIGURABLE_CATEGORIES.map((catName) => {
    const existing = parsedCategories.find((c) => c.category === catName)
    return existing ?? { category: catName, enabled: true }
  })

  const parts = Array.isArray(rig.parts)
    ? rig.parts.map(parsePartV3).filter((part): part is RigPartDefinition => Boolean(part))
    : []

  return {
    id: rig.id,
    name: rig.name,
    characterKey: rig.characterKey,
    characterName: rig.characterName,
    canvasWidth: Math.max(64, Math.round(rig.canvasWidth)),
    canvasHeight: Math.max(64, Math.round(rig.canvasHeight)),
    body,
    bodyCalibration,
    categories,
    parts,
    excludedPartKeys: Array.isArray(rig.excludedPartKeys)
      ? rig.excludedPartKeys.filter((key): key is string => typeof key === 'string')
      : [],
    updatedAt: finite(rig.updatedAt) ? rig.updatedAt : Date.now()
  }
}

export function migrateRigV2ToV3(rawV2: unknown): RigDefinition | null {
  if (!rawV2 || typeof rawV2 !== 'object') return null
  const rig = rawV2 as Record<string, unknown>
  const body = parseIdentity(rig.body)
  if (
    typeof rig.id !== 'string' ||
    typeof rig.name !== 'string' ||
    typeof rig.characterKey !== 'string' ||
    typeof rig.characterName !== 'string' ||
    !finite(rig.canvasWidth) ||
    !finite(rig.canvasHeight) ||
    !body ||
    body.category !== 'body'
  ) {
    return null
  }

  const rawParts = Array.isArray(rig.parts) ? rig.parts : []
  const v2Parts = rawParts.flatMap((rawPart) => {
    if (!rawPart || typeof rawPart !== 'object') return []
    const p = rawPart as { asset?: unknown; calibration?: unknown; isDefault?: unknown }
    const asset = parseIdentity(p.asset)
    const calibration = parseCalibration(p.calibration)
    return asset && calibration ? [{ asset, calibration, isDefault: Boolean(p.isDefault) }] : []
  })

  // 1. Find body calibration from v2 parts or default
  const bodyPart = v2Parts.find(
    (part) => part.asset.category === 'body' && assetsShareRigIdentity(body, part.asset)
  )
  const bodyCalibration: AssetCalibration = bodyPart
    ? { ...bodyPart.calibration }
    : { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }

  // 2. Build configurable categories & parts
  const categories: RigCategoryDefinition[] = []
  const partsV3: RigPartDefinition[] = []

  for (const catName of RIG_CONFIGURABLE_CATEGORIES) {
    const matchingParts = v2Parts.filter((p) => p.asset.category === catName)
    if (matchingParts.length === 0) {
      categories.push({ category: catName, enabled: true })
      continue
    }

    const defaultPart = matchingParts.find((p) => p.isDefault) ?? matchingParts[0]
    const template: AssetCalibration = { ...defaultPart.calibration }
    const defaultPartKey = rigAssetKey(defaultPart.asset)

    categories.push({
      category: catName,
      enabled: true,
      template,
      defaultPartKey
    })

    for (const p of matchingParts) {
      const isDefault = rigAssetKey(p.asset) === defaultPartKey
      const isOverride = !isDefault && !areCalibrationsEquivalent(p.calibration, template)
      partsV3.push({
        asset: p.asset,
        calibrationOverride: isOverride ? { ...p.calibration } : undefined
      })
    }
  }

  return {
    id: rig.id,
    name: rig.name,
    characterKey: rig.characterKey,
    characterName: rig.characterName,
    canvasWidth: Math.max(64, Math.round(rig.canvasWidth)),
    canvasHeight: Math.max(64, Math.round(rig.canvasHeight)),
    body,
    bodyCalibration,
    categories,
    parts: partsV3,
    excludedPartKeys: Array.isArray(rig.excludedPartKeys)
      ? rig.excludedPartKeys.filter((key): key is string => typeof key === 'string')
      : [],
    updatedAt: finite(rig.updatedAt) ? rig.updatedAt : Date.now()
  }
}

export function createRigCatalogFile(
  rigs: RigDefinition[],
  defaultRigByCharacter: Record<string, string>
): RigCatalogFile {
  return {
    schema: RIG_CATALOG_SCHEMA,
    version: RIG_CATALOG_VERSION,
    exportedAt: new Date().toISOString(),
    defaultRigByCharacter: { ...defaultRigByCharacter },
    rigs: JSON.parse(JSON.stringify(rigs)) as RigDefinition[]
  }
}

export function parseRigCatalogFile(raw: string): RigCatalogFile {
  const value = JSON.parse(raw) as Partial<RigCatalogFile> & { version?: number }
  if (value.schema !== RIG_CATALOG_SCHEMA) {
    throw new Error('Format de catalogue de rigs non reconnu.')
  }

  let rigs: RigDefinition[] = []
  if (value.version === 3) {
    rigs = Array.isArray(value.rigs)
      ? value.rigs.map(parseRigV3).filter((rig): rig is RigDefinition => Boolean(rig))
      : []
  } else if (value.version === 2) {
    rigs = Array.isArray(value.rigs)
      ? value.rigs.map(migrateRigV2ToV3).filter((rig): rig is RigDefinition => Boolean(rig))
      : []
  } else {
    throw new Error(`Version de catalogue de rigs non prise en charge : ${value.version}`)
  }

  if (rigs.length === 0) throw new Error('Aucun rig valide dans ce fichier.')

  return {
    schema: RIG_CATALOG_SCHEMA,
    version: RIG_CATALOG_VERSION,
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : new Date().toISOString(),
    defaultRigByCharacter:
      value.defaultRigByCharacter && typeof value.defaultRigByCharacter === 'object'
        ? Object.fromEntries(
            Object.entries(value.defaultRigByCharacter).filter(
              (entry): entry is [string, string] => typeof entry[1] === 'string'
            )
          )
        : {},
    rigs
  }
}
