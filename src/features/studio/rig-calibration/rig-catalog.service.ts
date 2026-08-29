import type { Asset, AssetCalibration, AssetCategory } from '@core/types/asset.types'
import {
  RIG_CATALOG_SCHEMA,
  RIG_CATALOG_VERSION,
  RIG_CONFIGURABLE_CATEGORIES,
  RIG_SLOT_CATEGORIES,
  type DuplicateRigOptions,
  type RigAssetIdentity,
  type RigCatalogFile,
  type RigCategoryDefinition,
  type RigConfigurableCategory,
  type RigDefinition,
  type RigPartDefinition,
  type RigPoint,
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

export function defaultBodyOrigin(body: Pick<RigAssetIdentity, 'width' | 'height'>): RigPoint {
  return { x: body.width / 2, y: body.height / 2 }
}

export function bodyOriginInRigSpace(rig: RigDefinition): RigPoint {
  return {
    x: rig.bodyCalibration.x + rig.bodyOrigin.x * rig.bodyCalibration.scaleX,
    y: rig.bodyCalibration.y + rig.bodyOrigin.y * rig.bodyCalibration.scaleY
  }
}

export function partCalibrationToAbsolute(
  rig: RigDefinition,
  calibration: AssetCalibration
): AssetCalibration {
  const origin = bodyOriginInRigSpace(rig)
  return {
    ...calibration,
    x: origin.x + calibration.x,
    y: origin.y + calibration.y
  }
}

export function partCalibrationToRelative(
  rig: RigDefinition,
  calibration: AssetCalibration
): AssetCalibration {
  const origin = bodyOriginInRigSpace(rig)
  return {
    ...calibration,
    x: calibration.x - origin.x,
    y: calibration.y - origin.y
  }
}

export const headCalibrationToAbsolute = partCalibrationToAbsolute
export const headCalibrationToRelative = partCalibrationToRelative

function convertAbsolutePartsToRelative(
  rig: RigDefinition,
  shouldConvert: (category: RigConfigurableCategory) => boolean = () => true
): void {
  for (const category of rig.categories) {
    if (category.template && shouldConvert(category.category)) {
      category.template = partCalibrationToRelative(rig, category.template)
    }
  }
  for (const part of rig.parts) {
    if (
      part.calibrationOverride &&
      isRigConfigurableCategory(part.asset.category) &&
      shouldConvert(part.asset.category)
    ) {
      part.calibrationOverride = partCalibrationToRelative(rig, part.calibrationOverride)
    }
  }
}

/** Déplace le repère sans déplacer visuellement les pièces déjà calibrées. */
export function rebaseRigBodyOrigin(rig: RigDefinition, nextOrigin: RigPoint): RigDefinition {
  const previousRig = JSON.parse(JSON.stringify(rig)) as RigDefinition
  const nextRig = JSON.parse(JSON.stringify(rig)) as RigDefinition
  nextRig.bodyOrigin = { ...nextOrigin }

  for (const category of nextRig.categories) {
    if (category.template) {
      category.template = partCalibrationToRelative(
        nextRig,
        partCalibrationToAbsolute(previousRig, category.template)
      )
    }
  }

  for (const part of nextRig.parts) {
    if (!part.calibrationOverride) continue
    part.calibrationOverride = partCalibrationToRelative(
      nextRig,
      partCalibrationToAbsolute(previousRig, part.calibrationOverride)
    )
  }
  nextRig.updatedAt = Date.now()
  return nextRig
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

/** Calibration attendue par les calques du document, toujours absolue dans le repère du rig. */
export function effectiveLayerCalibration(
  rig: RigDefinition,
  part: RigPartDefinition,
  asset?: Asset
): AssetCalibration | null {
  const calibration = effectiveCalibration(rig, part, asset)
  if (!calibration) return null
  return isRigConfigurableCategory(part.asset.category)
    ? partCalibrationToAbsolute(rig, calibration)
    : { ...calibration }
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

  const rig: RigDefinition = {
    id: createRigId(bodyAsset.character?.key ?? 'berlu', body),
    name: bodyAsset.name,
    characterKey: bodyAsset.character?.key ?? 'berlu',
    characterName: bodyAsset.character?.name ?? 'Berlu',
    canvasWidth: DEFAULT_RIG_CANVAS.width,
    canvasHeight: DEFAULT_RIG_CANVAS.height,
    body,
    bodyCalibration,
    bodyOrigin: defaultBodyOrigin(body),
    categories,
    parts,
    excludedPartKeys: [],
    updatedAt: Date.now()
  }
  convertAbsolutePartsToRelative(rig)
  return rig
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
  targetRig: RigDefinition,
  options?: DuplicateRigOptions
): RigDefinition {
  const result: RigDefinition = JSON.parse(JSON.stringify(targetRig)) as RigDefinition
  const copyAll = !options || Object.values(options).every((v) => v === undefined)

  if (copyAll || options?.copyOrigin) {
    result.bodyOrigin = { ...sourceRig.bodyOrigin }
  }

  if (copyAll) {
    result.categories = JSON.parse(JSON.stringify(sourceRig.categories)) as RigCategoryDefinition[]
    result.parts = JSON.parse(JSON.stringify(sourceRig.parts)) as RigPartDefinition[]
    result.excludedPartKeys = [...sourceRig.excludedPartKeys]
  } else {
    if (options?.copyCommonPosition) {
      const sourceHeadCat = sourceRig.categories.find((c) => c.category === 'head')
      let targetHeadCat = result.categories.find((c) => c.category === 'head')
      if (!targetHeadCat) {
        targetHeadCat = { category: 'head', enabled: true }
        result.categories.push(targetHeadCat)
      }
      if (sourceHeadCat?.template) {
        targetHeadCat.template = { ...sourceHeadCat.template }
      }
    }

    if (options?.copyDefaultHead) {
      const sourceHeadCat = sourceRig.categories.find((c) => c.category === 'head')
      let targetHeadCat = result.categories.find((c) => c.category === 'head')
      if (!targetHeadCat) {
        targetHeadCat = { category: 'head', enabled: true }
        result.categories.push(targetHeadCat)
      }
      if (sourceHeadCat?.defaultPartKey) {
        targetHeadCat.defaultPartKey = sourceHeadCat.defaultPartKey
      }
    }

    if (options?.copySpecificPositions) {
      for (const sourcePart of sourceRig.parts) {
        if (sourcePart.asset.category !== 'head' || !sourcePart.calibrationOverride) continue
        const key = rigAssetKey(sourcePart.asset)
        let targetPart = result.parts.find((p) => rigAssetKey(p.asset) === key)
        if (!targetPart) {
          targetPart = { asset: { ...sourcePart.asset } }
          result.parts.push(targetPart)
        }
        targetPart.calibrationOverride = { ...sourcePart.calibrationOverride }
      }
    }

    if (options?.copyCompatibilities) {
      result.excludedPartKeys = [...sourceRig.excludedPartKeys]
      for (const sourcePart of sourceRig.parts) {
        const key = rigAssetKey(sourcePart.asset)
        if (!result.parts.some((p) => rigAssetKey(p.asset) === key)) {
          result.parts.push({ asset: { ...sourcePart.asset } })
        }
      }
    }
  }

  result.updatedAt = Date.now()
  return result
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function parsePoint(value: unknown): RigPoint | null {
  if (!value || typeof value !== 'object') return null
  const point = value as Partial<RigPoint>
  return finite(point.x) && finite(point.y) ? { x: point.x, y: point.y } : null
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

function parsePart(value: unknown): RigPartDefinition | null {
  if (!value || typeof value !== 'object') return null
  const part = value as Partial<RigPartDefinition>
  const asset = parseIdentity(part.asset)
  if (!asset || asset.category === 'body') return null
  const calibrationOverride = part.calibrationOverride
    ? parseCalibration(part.calibrationOverride) ?? undefined
    : undefined
  return { asset, calibrationOverride }
}

export function parseRigDefinition(value: unknown): RigDefinition | null {
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
    ? rig.parts.map(parsePart).filter((part): part is RigPartDefinition => Boolean(part))
    : []

  const parsed: RigDefinition = {
    id: rig.id,
    name: rig.name,
    characterKey: rig.characterKey,
    characterName: rig.characterName,
    canvasWidth: Math.max(64, Math.round(rig.canvasWidth)),
    canvasHeight: Math.max(64, Math.round(rig.canvasHeight)),
    body,
    bodyCalibration,
    bodyOrigin: parsePoint(rig.bodyOrigin) ?? defaultBodyOrigin(body),
    categories,
    parts,
    excludedPartKeys: Array.isArray(rig.excludedPartKeys)
      ? rig.excludedPartKeys.filter((key): key is string => typeof key === 'string')
      : [],
    updatedAt: finite(rig.updatedAt) ? rig.updatedAt : Date.now()
  }

  return parsed
}

export const parseRigV6 = parseRigDefinition

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

  const rawRigs = Array.isArray(value.rigs) ? value.rigs : []
  const rigs: RigDefinition[] = rawRigs
    .map(parseRigDefinition)
    .filter((rig): rig is RigDefinition => Boolean(rig))

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
