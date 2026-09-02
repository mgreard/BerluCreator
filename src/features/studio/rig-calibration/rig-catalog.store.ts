import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, AssetCalibration, HeadSeriesId, NormalizedPoint } from '@core/types/asset.types'
import {
  assetsShareRigIdentity,
  createHeadSeriesProfile,
  createRigCatalogFile,
  createRigDefinition,
  findAssetByRigIdentity,
  headCalibration,
  parseRigCatalogFile,
  rigAssetKey,
  validateHeadAssetSeries
} from './rig-catalog.service'
import type {
  HeadSeriesProfile,
  RigCatalogFile,
  RigDefinition,
  RigHeadSeriesConfig,
  RigPoint
} from './rig-catalog.types'
import { getDefaultRigCatalogFile } from './default-rig-catalog'
import { RIG_CATALOG_STORAGE_KEY } from './rig-catalog.types'

function readCatalog(): RigCatalogFile {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(RIG_CATALOG_STORAGE_KEY)
    if (raw) {
      try {
        return parseRigCatalogFile(raw)
      } catch {
        localStorage.removeItem(RIG_CATALOG_STORAGE_KEY)
      }
    }
  }
  return getDefaultRigCatalogFile()
}

export const useRigCatalogStore = defineStore('rigCatalog', () => {
  const initial = readCatalog()
  const rigs = ref<RigDefinition[]>(initial.rigs)
  const headSeries = ref<HeadSeriesProfile[]>(initial.headSeries)
  const defaultRigByCharacter = ref<Record<string, string>>(initial.defaultRigByCharacter)
  const isCalibrationOpen = ref(false)
  const selectedRigId = ref<string | null>(null)
  const selectedHeadSeriesId = ref<HeadSeriesId>('berlu')
  const calibrationTargetId = ref<string | null>(null)

  function persist(): void {
    rigs.value = [...rigs.value]
    headSeries.value = [...headSeries.value]
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      RIG_CATALOG_STORAGE_KEY,
      JSON.stringify(createRigCatalogFile(rigs.value, defaultRigByCharacter.value, headSeries.value))
    )
  }

  function seriesById(id?: string | null): HeadSeriesProfile | undefined {
    return id ? headSeries.value.find((series) => series.id === id) : undefined
  }

  function initialize(assets: Asset[]): void {
    const heads = assets.filter((asset) => asset.category === 'head' && asset.headSeriesId)
    for (const asset of heads) {
      let series = seriesById(asset.headSeriesId)
      if (!series) {
        series = createHeadSeriesProfile(asset.headSeriesId!, asset.width, asset.height)
        headSeries.value.push(series)
      }
      validateHeadAssetSeries(asset, series)
    }

    for (const body of assets.filter((asset) => asset.category === 'body')) {
      if (rigs.value.some((rig) => assetsShareRigIdentity(rig.body, body))) continue
      const rig = createRigDefinition(body)
      rigs.value.push(rig)
      if (!defaultRigByCharacter.value[rig.characterKey]) {
        defaultRigByCharacter.value[rig.characterKey] = rig.id
      }
    }

    const bodyKeys = new Set(
      assets.filter((asset) => asset.category === 'body').map((asset) => rigAssetKey(asset))
    )
    rigs.value = rigs.value.filter((rig) => bodyKeys.has(rigAssetKey(rig.body)))
    defaultRigByCharacter.value = Object.fromEntries(
      Object.entries(defaultRigByCharacter.value).filter(([, rigId]) =>
        rigs.value.some((rig) => rig.id === rigId)
      )
    )
    persist()
  }

  function rigById(id?: string | null): RigDefinition | undefined {
    return id ? rigs.value.find((rig) => rig.id === id) : undefined
  }

  function rigsForCharacter(characterKey: string): RigDefinition[] {
    return rigs.value.filter((rig) => rig.characterKey === characterKey)
  }

  function defaultRig(characterKey: string): RigDefinition | undefined {
    return rigById(defaultRigByCharacter.value[characterKey]) ?? rigsForCharacter(characterKey)[0]
  }

  function compatibleRigs(asset: Asset): RigDefinition[] {
    if (asset.category === 'body') {
      return rigs.value.filter((rig) => assetsShareRigIdentity(rig.body, asset))
    }
    if (asset.category === 'head' || asset.category === 'mouth') {
      return rigs.value.filter((rig) =>
        rig.headSeries.some((entry) => entry.enabled && entry.seriesId === asset.headSeriesId)
      )
    }
    if (asset.category === 'props_character') {
      return rigs.value.filter((rig) => rig.headSeries.some((entry) => entry.enabled))
    }
    return []
  }

  function isAssetCompatible(rig: RigDefinition, asset: Asset): boolean {
    return compatibleRigs(asset).some((candidate) => candidate.id === rig.id)
  }

  function effectiveCalibrationForAsset(rig: RigDefinition, asset: Asset): AssetCalibration | null {
    if (asset.category === 'body') {
      return assetsShareRigIdentity(rig.body, asset)
        ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 10 }
        : null
    }
    if (asset.category === 'head') {
      const series = seriesById(asset.headSeriesId)
      return series ? headCalibration(rig, series, asset) : null
    }
    return null
  }

  function updateHeadSeries(
    id: HeadSeriesId,
    patch: Partial<Omit<HeadSeriesProfile, 'id'>>
  ): void {
    const series = seriesById(id)
    if (!series) return
    Object.assign(series, patch, { updatedAt: Date.now() })
    persist()
  }

  function createHeadSeries(id: string, label: string, width: number, height: number): HeadSeriesProfile {
    const created = createHeadSeriesProfile(id, width, height, label)
    if (seriesById(created.id)) throw new Error(`La série « ${created.id} » existe déjà.`)
    headSeries.value.push(created)
    selectedHeadSeriesId.value = created.id
    persist()
    return created
  }

  function updateSeriesAnchor(
    seriesId: HeadSeriesId,
    anchor: 'neckPivot' | 'mouthAnchor' | 'sunglass' | 'hat',
    point: NormalizedPoint
  ): void {
    const series = seriesById(seriesId)
    if (!series) return
    const normalized = {
      x: Math.max(0, Math.min(1, point.x)),
      y: Math.max(0, Math.min(1, point.y))
    }
    if (anchor === 'neckPivot' || anchor === 'mouthAnchor') series[anchor] = normalized
    else series.propAnchors[anchor] = normalized
    series.updatedAt = Date.now()
    persist()
  }

  function setSeriesCompatibility(rigId: string, seriesId: HeadSeriesId, enabled: boolean): void {
    const rig = rigById(rigId)
    const series = seriesById(seriesId)
    if (!rig || !series) return
    let config = rig.headSeries.find((entry) => entry.seriesId === seriesId)
    if (!config) {
      const targetHeight = Math.max(1, rig.body.height * 0.34)
      config = {
        seriesId,
        enabled,
        defaultScale: Number((targetHeight / series.height).toFixed(4)),
        defaultRotation: 0
      }
      rig.headSeries.push(config)
    } else {
      config.enabled = enabled
    }
    rig.updatedAt = Date.now()
    persist()
  }

  function updateSeriesDefaults(
    rigId: string,
    seriesId: HeadSeriesId,
    patch: Partial<Pick<RigHeadSeriesConfig, 'defaultScale' | 'defaultRotation' | 'defaultHeadAssetKey'>>
  ): void {
    const rig = rigById(rigId)
    const config = rig?.headSeries.find((entry) => entry.seriesId === seriesId)
    if (!rig || !config) return
    Object.assign(config, patch)
    config.defaultScale = Math.max(0.01, config.defaultScale)
    rig.updatedAt = Date.now()
    persist()
  }

  function updateRigGeometry(
    rigId: string,
    patch: Partial<Pick<RigDefinition, 'neckAnchor' | 'headMotionRadius' | 'calibrated'>>
  ): void {
    const rig = rigById(rigId)
    if (!rig) return
    if (patch.neckAnchor) rig.neckAnchor = { ...patch.neckAnchor }
    if (patch.headMotionRadius !== undefined) rig.headMotionRadius = Math.max(0, patch.headMotionRadius)
    if (patch.calibrated !== undefined) rig.calibrated = patch.calibrated
    rig.updatedAt = Date.now()
    persist()
  }

  function setDefaultRig(characterKey: string, rigId: string): void {
    if (!rigs.value.some((rig) => rig.id === rigId && rig.characterKey === characterKey)) return
    defaultRigByCharacter.value = { ...defaultRigByCharacter.value, [characterKey]: rigId }
    persist()
  }

  function replaceCatalog(file: RigCatalogFile, assets: Asset[]): void {
    rigs.value = structuredClone(file.rigs)
    headSeries.value = structuredClone(file.headSeries)
    defaultRigByCharacter.value = { ...file.defaultRigByCharacter }
    initialize(assets)
  }

  function exportCatalog(): RigCatalogFile {
    return createRigCatalogFile(rigs.value, defaultRigByCharacter.value, headSeries.value)
  }

  function importCatalog(raw: string, assets: Asset[]): RigCatalogFile {
    const file = parseRigCatalogFile(raw)
    replaceCatalog(file, assets)
    return file
  }

  function resolveBodyAsset(rig: RigDefinition, assets: Asset[]): Asset | undefined {
    return findAssetByRigIdentity(rig.body, assets)
  }

  function openCalibration(rigId?: string): void {
    selectedRigId.value = rigId ?? selectedRigId.value ?? rigs.value[0]?.id ?? null
    isCalibrationOpen.value = true
  }

  function closeCalibration(): void {
    isCalibrationOpen.value = false
    calibrationTargetId.value = null
  }

  function resetToDefaultCatalog(assets: Asset[]): void {
    replaceCatalog(getDefaultRigCatalogFile(), assets)
  }

  // Adaptateurs temporaires pour les consommateurs qui ne demandent qu'un test de compatibilité.
  function partForAsset(rig: RigDefinition, asset: Asset) {
    return isAssetCompatible(rig, asset) ? { asset } : undefined
  }

  function resolvePartAsset(part: { asset: Asset }, assets: Asset[]): Asset | undefined {
    return assets.find((asset) => asset.id === part.asset.id) ?? part.asset
  }

  function updateRigBodyOrigin(rigId: string, point: RigPoint): void {
    updateRigGeometry(rigId, { neckAnchor: point })
  }

  return {
    rigs,
    headSeries,
    defaultRigByCharacter,
    isCalibrationOpen,
    selectedRigId,
    selectedHeadSeriesId,
    calibrationTargetId,
    initialize,
    rigById,
    rigsForCharacter,
    defaultRig,
    seriesById,
    compatibleRigs,
    isAssetCompatible,
    effectiveCalibrationForAsset,
    updateHeadSeries,
    createHeadSeries,
    updateSeriesAnchor,
    setSeriesCompatibility,
    updateSeriesDefaults,
    updateRigGeometry,
    updateRigBodyOrigin,
    setDefaultRig,
    replaceCatalog,
    resetToDefaultCatalog,
    exportCatalog,
    importCatalog,
    resolveBodyAsset,
    partForAsset,
    resolvePartAsset,
    openCalibration,
    closeCalibration
  }
})
