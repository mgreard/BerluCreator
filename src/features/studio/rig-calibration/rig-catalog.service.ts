import type { Asset, AssetCalibration, AssetCategory, HeadSeriesId } from '@core/types/asset.types'
import {
  RIG_CATALOG_SCHEMA,
  RIG_CATALOG_VERSION,
  type HeadSeriesProfile,
  type RigAssetIdentity,
  type RigCatalogFile,
  type RigDefinition,
  type RigHeadSeriesConfig,
  type RigPoint
} from './rig-catalog.types'

export const DEFAULT_RIG_CANVAS = { width: 840, height: 908 } as const
export const BERLU_HEAD_SERIES_ID = 'berlu' as const

export interface AlphaBounds {
  x: number
  y: number
  width: number
  height: number
}

export function initialBodyRigGeometry(
  bodyWidth: number,
  bodyHeight: number,
  bounds?: AlphaBounds
): { neckAnchor: RigPoint; headMotionRadius: number } {
  const visible = bounds ?? { x: 0, y: 0, width: bodyWidth, height: bodyHeight }
  return {
    neckAnchor: {
      x: Math.round(visible.x + visible.width / 2),
      y: Math.round(visible.y + visible.height * 0.12)
    },
    headMotionRadius: Math.max(8, Math.round(visible.height * 0.06))
  }
}

export function createBerluHeadSeries(): HeadSeriesProfile {
  return {
    id: BERLU_HEAD_SERIES_ID,
    label: 'Berlu',
    width: 1205,
    height: 1305,
    neckPivot: { x: 0.5, y: 0.94 },
    mouthAnchor: { x: 0.5, y: 0.66 },
    propAnchors: {
      sunglass: { x: 0.5, y: 0.43 },
      hat: { x: 0.5, y: 0.08 }
    },
    updatedAt: Date.now()
  }
}

export function isRigSlotCategory(category: AssetCategory): boolean {
  return ['body', 'head', 'mouth', 'props_character'].includes(category)
}

export function isRigConfigurableCategory(
  category: AssetCategory
): category is Extract<AssetCategory, 'head' | 'mouth' | 'props_character'> {
  return category === 'head' || category === 'mouth' || category === 'props_character'
}

export function normalizedName(value: string): string {
  return value.trim().toLocaleLowerCase('fr')
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

export function rigAssetIdentity(
  asset: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): RigAssetIdentity {
  if (asset.category !== 'body') throw new Error('Un rig doit être créé depuis un corps.')
  return { name: asset.name, category: 'body', width: asset.width, height: asset.height }
}

export function rigAssetKey(identity: Pick<Asset, 'name' | 'category' | 'width' | 'height'>): string {
  return `${identity.category}:${normalizedName(identity.name)}:${identity.width}x${identity.height}`
}

export function assetsShareRigIdentity(
  left: Pick<RigAssetIdentity, 'name' | 'category' | 'width' | 'height'>,
  right: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): boolean {
  return (
    left.category === right.category &&
    normalizedName(left.name) === normalizedName(right.name) &&
    left.width === right.width &&
    left.height === right.height
  )
}

export function findAssetByRigIdentity(identity: RigAssetIdentity, assets: Asset[]): Asset | undefined {
  return assets.find((asset) => assetsShareRigIdentity(identity, asset))
}

export function createRigId(characterKey: string, body: RigAssetIdentity): string {
  return `rig-${slugify(characterKey)}-${slugify(body.name)}-${body.width}x${body.height}`
}

export function createRigDefinition(bodyAsset: Asset): RigDefinition {
  const body = rigAssetIdentity(bodyAsset)
  const characterKey = bodyAsset.character?.key ?? slugify(bodyAsset.name)
  const geometry = initialBodyRigGeometry(body.width, body.height)
  return {
    id: createRigId(characterKey, body),
    name: bodyAsset.name,
    characterKey,
    characterName: bodyAsset.character?.name ?? bodyAsset.name,
    body,
    ...geometry,
    headSeries: [],
    calibrated: false,
    updatedAt: Date.now()
  }
}

export function headSeriesConfig(
  rig: RigDefinition,
  seriesId?: HeadSeriesId
): RigHeadSeriesConfig | undefined {
  return seriesId ? rig.headSeries.find((entry) => entry.seriesId === seriesId && entry.enabled) : undefined
}

export function headCalibration(
  rig: RigDefinition,
  series: HeadSeriesProfile,
  asset: Pick<Asset, 'width' | 'height'>
): AssetCalibration | null {
  const config = headSeriesConfig(rig, series.id)
  if (!config) return null
  const scale = config.defaultScale
  return {
    // Le cou reste l'origine de l'échelle et du placement. Le renderer utilise
    // une origine distincte, au centre visuel du sprite, pour la rotation.
    x: rig.neckAnchor.x - series.neckPivot.x * asset.width,
    y: rig.neckAnchor.y - series.neckPivot.y * asset.height,
    scaleX: scale,
    scaleY: scale,
    rotation: config.defaultRotation,
    zIndex: 20
  }
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

export function clampHeadOffset(offset: RigPoint, radius: number): RigPoint {
  const safeRadius = Math.max(0, radius)
  const distance = Math.hypot(offset.x, offset.y)
  if (distance <= safeRadius || distance === 0) return { ...offset }
  const factor = safeRadius / distance
  return { x: offset.x * factor, y: offset.y * factor }
}

export function createHeadSeriesProfile(
  id: string,
  width: number,
  height: number,
  label = id
): HeadSeriesProfile {
  if (!id.trim() || width <= 0 || height <= 0) throw new Error('Série de têtes invalide.')
  return {
    id: slugify(id),
    label: label.trim() || id,
    width,
    height,
    neckPivot: { x: 0.5, y: 0.94 },
    mouthAnchor: { x: 0.5, y: 0.66 },
    propAnchors: { sunglass: { x: 0.5, y: 0.43 }, hat: { x: 0.5, y: 0.08 } },
    updatedAt: Date.now()
  }
}

export function validateHeadAssetSeries(asset: Asset, series: HeadSeriesProfile): void {
  if (asset.category !== 'head' || asset.headSeriesId !== series.id) return
  if (asset.width !== series.width || asset.height !== series.height) {
    throw new Error(
      `La tête « ${asset.name} » mesure ${asset.width}×${asset.height}, au lieu de ${series.width}×${series.height} pour la série ${series.label}.`
    )
  }
}

export function createRigCatalogFile(
  rigs: RigDefinition[],
  defaultRigByCharacter: Record<string, string>,
  headSeries: HeadSeriesProfile[]
): RigCatalogFile {
  // Vue wraps Pinia arrays in proxies, which structuredClone deliberately rejects.
  const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  return {
    schema: RIG_CATALOG_SCHEMA,
    version: RIG_CATALOG_VERSION,
    exportedAt: new Date().toISOString(),
    defaultRigByCharacter: { ...defaultRigByCharacter },
    headSeries: plain(headSeries),
    rigs: plain(rigs)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseRigCatalogFile(raw: string): RigCatalogFile {
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    throw new Error('Le catalogue de rigs ne contient pas de JSON valide.')
  }
  if (!isRecord(value) || value.schema !== RIG_CATALOG_SCHEMA) {
    throw new Error('Ce fichier n’est pas un catalogue de rigs BerluCreator.')
  }
  if (value.version !== RIG_CATALOG_VERSION) {
    throw new Error(`Version de catalogue non prise en charge : ${String(value.version)}.`)
  }
  if (!Array.isArray(value.rigs) || !Array.isArray(value.headSeries) || !isRecord(value.defaultRigByCharacter)) {
    throw new Error('Le catalogue de rigs est incomplet.')
  }
  const file = value as unknown as RigCatalogFile
  for (const series of file.headSeries) {
    if (!series.id || series.width <= 0 || series.height <= 0) throw new Error('Profil de série invalide.')
  }
  for (const rig of file.rigs) {
    if (!rig.id || rig.body?.category !== 'body' || !Array.isArray(rig.headSeries)) {
      throw new Error('Définition de rig invalide.')
    }
  }
  return JSON.parse(JSON.stringify(file)) as RigCatalogFile
}
