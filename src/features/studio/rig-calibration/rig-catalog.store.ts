import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Asset, AssetCalibration } from '@core/types/asset.types'
import {
  assetsShareRigIdentity,
  createRigCatalogFile,
  createRigDefinition,
  duplicateRigConfig,
  effectiveCalibration,
  findAssetByRigIdentity,
  identityCalibration,
  isRigConfigurableCategory,
  isRigSlotCategory,
  parseRigCatalogFile,
  rigAssetIdentity,
  rigAssetKey
} from './rig-catalog.service'
import type {
  RigCatalogFile,
  RigCategoryDefinition,
  RigConfigurableCategory,
  RigDefinition,
  RigPartDefinition
} from './rig-catalog.types'
import { RIG_CATALOG_STORAGE_KEY } from './rig-catalog.types'

const STORAGE_KEY_V2 = 'berlu-creator:rig-catalog:v2'

function readCatalog(): Pick<RigCatalogFile, 'rigs' | 'defaultRigByCharacter'> {
  if (typeof localStorage === 'undefined') return { rigs: [], defaultRigByCharacter: {} }
  const rawV3 = localStorage.getItem(RIG_CATALOG_STORAGE_KEY)
  if (rawV3) {
    try {
      const parsed = parseRigCatalogFile(rawV3)
      return { rigs: parsed.rigs, defaultRigByCharacter: parsed.defaultRigByCharacter }
    } catch {
      // Fall through to v2 check
    }
  }

  const rawV2 = localStorage.getItem(STORAGE_KEY_V2)
  if (rawV2) {
    try {
      const parsed = parseRigCatalogFile(rawV2)
      localStorage.setItem(RIG_CATALOG_STORAGE_KEY, JSON.stringify(parsed))
      localStorage.removeItem(STORAGE_KEY_V2)
      return { rigs: parsed.rigs, defaultRigByCharacter: parsed.defaultRigByCharacter }
    } catch {
      return { rigs: [], defaultRigByCharacter: {} }
    }
  }

  return { rigs: [], defaultRigByCharacter: {} }
}

export const useRigCatalogStore = defineStore('rigCatalog', () => {
  const initial = readCatalog()
  const rigs = ref<RigDefinition[]>(initial.rigs)
  const defaultRigByCharacter = ref<Record<string, string>>(initial.defaultRigByCharacter)
  const isCalibrationOpen = ref(false)
  const selectedRigId = ref<string | null>(null)

  function persist(): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      RIG_CATALOG_STORAGE_KEY,
      JSON.stringify(createRigCatalogFile(rigs.value, defaultRigByCharacter.value))
    )
  }

  function initialize(assets: Asset[]): void {
    const characterAssets = new Map<string, Asset[]>()
    for (const asset of assets) {
      if (!asset.character || !isRigSlotCategory(asset.category)) continue
      const list = characterAssets.get(asset.character.key) ?? []
      list.push(asset)
      characterAssets.set(asset.character.key, list)
    }

    for (const [characterKey, collection] of characterAssets) {
      const bodies = collection.filter((asset) => asset.category === 'body')
      for (const body of bodies) {
        let rig = rigs.value.find(
          (candidate) =>
            candidate.characterKey === characterKey && assetsShareRigIdentity(candidate.body, body)
        )
        if (!rig) {
          rig = createRigDefinition(body, collection)
          rigs.value.push(rig)
        } else {
          // Ensure body calibration is initialized if missing
          if (!rig.bodyCalibration) {
            rig.bodyCalibration = identityCalibration(body)
          }

          const existingKeys = new Set(rig.parts.map((part) => rigAssetKey(part.asset)))
          for (const asset of collection) {
            if (asset.category === 'body' || !isRigConfigurableCategory(asset.category)) continue
            const assetIdentity = rigAssetIdentity(asset)
            const key = rigAssetKey(assetIdentity)
            if (existingKeys.has(key) || rig.excludedPartKeys.includes(key)) continue

            let categoryDef = rig.categories.find((c) => c.category === asset.category)
            if (!categoryDef) {
              categoryDef = { category: asset.category, enabled: true }
              rig.categories.push(categoryDef)
            }

            if (!categoryDef.template) {
              categoryDef.template = identityCalibration(asset)
            }
            if (!categoryDef.defaultPartKey) {
              categoryDef.defaultPartKey = key
            }

            rig.parts.push({
              asset: assetIdentity
            })
          }
        }
      }

      const availableRigs = rigs.value.filter((rig) => rig.characterKey === characterKey)
      if (
        availableRigs.length > 0 &&
        !availableRigs.some((rig) => rig.id === defaultRigByCharacter.value[characterKey])
      ) {
        defaultRigByCharacter.value[characterKey] = availableRigs[0].id
      }
    }
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

  function categoryForRig(
    rig: RigDefinition,
    category: RigConfigurableCategory
  ): RigCategoryDefinition | undefined {
    return rig.categories.find((candidate) => candidate.category === category)
  }

  function partForAsset(rig: RigDefinition, asset: Asset): RigPartDefinition | undefined {
    if (asset.category === 'body') {
      return assetsShareRigIdentity(rig.body, asset) ? { asset: rig.body } : undefined
    }
    return rig.parts.find((part) => assetsShareRigIdentity(part.asset, asset))
  }

  function compatibleRigs(asset: Asset): RigDefinition[] {
    if (!asset.character || !isRigSlotCategory(asset.category)) return []
    if (asset.category === 'body') {
      return rigs.value.filter(
        (rig) =>
          rig.characterKey === asset.character?.key && assetsShareRigIdentity(rig.body, asset)
      )
    }
    return rigs.value.filter((rig) => {
      if (rig.characterKey !== asset.character?.key) return false
      const categoryDef = rig.categories.find((c) => c.category === asset.category)
      if (!categoryDef?.enabled) return false
      return rig.parts.some((part) => assetsShareRigIdentity(part.asset, asset))
    })
  }

  function effectiveCalibrationForAsset(rig: RigDefinition, asset: Asset): AssetCalibration | null {
    if (asset.category === 'body') {
      return { ...rig.bodyCalibration }
    }
    const part = partForAsset(rig, asset)
    if (!part) return null
    return effectiveCalibration(rig, part, asset)
  }

  function setCategoryEnabled(
    rigId: string,
    category: RigConfigurableCategory,
    enabled: boolean
  ): void {
    const rig = rigById(rigId)
    if (!rig) return
    let categoryDef = rig.categories.find((c) => c.category === category)
    if (!categoryDef) {
      categoryDef = { category, enabled }
      rig.categories.push(categoryDef)
    } else {
      categoryDef.enabled = enabled
    }
    rig.updatedAt = Date.now()
    persist()
  }

  function setPartCompatibility(rigId: string, asset: Asset, compatible: boolean): void {
    const rig = rigById(rigId)
    if (!rig || asset.category === 'body' || !isRigConfigurableCategory(asset.category)) return
    const identity = rigAssetIdentity(asset)
    const key = rigAssetKey(identity)
    let categoryDef = rig.categories.find((c) => c.category === asset.category)
    if (!categoryDef) {
      categoryDef = { category: asset.category, enabled: true }
      rig.categories.push(categoryDef)
    }

    const index = rig.parts.findIndex((part) => rigAssetKey(part.asset) === key)
    if (compatible) {
      rig.excludedPartKeys = rig.excludedPartKeys.filter((entry) => entry !== key)
      if (index < 0) {
        rig.parts.push({
          asset: identity
        })
        if (!categoryDef.template) {
          categoryDef.template = identityCalibration(asset)
        }
        if (!categoryDef.defaultPartKey) {
          categoryDef.defaultPartKey = key
        }
      }
    } else {
      if (index >= 0) {
        rig.parts.splice(index, 1)
      }
      rig.excludedPartKeys = Array.from(new Set([...rig.excludedPartKeys, key]))
      if (categoryDef.defaultPartKey === key) {
        const remaining = rig.parts.find((part) => part.asset.category === asset.category)
        categoryDef.defaultPartKey = remaining ? rigAssetKey(remaining.asset) : undefined
      }
    }
    rig.updatedAt = Date.now()
    persist()
  }

  function setDefaultPart(rigId: string, asset: Asset): void {
    const rig = rigById(rigId)
    if (!rig || asset.category === 'body' || !isRigConfigurableCategory(asset.category)) return
    const part = partForAsset(rig, asset)
    if (!part) return
    const categoryDef = rig.categories.find((c) => c.category === asset.category)
    if (!categoryDef) return

    categoryDef.defaultPartKey = rigAssetKey(part.asset)
    if (part.calibrationOverride) {
      categoryDef.template = { ...part.calibrationOverride }
      part.calibrationOverride = undefined
    }
    rig.updatedAt = Date.now()
    persist()
  }

  function savePartCalibration(rigId: string, asset: Asset, calibration: AssetCalibration): void {
    const rig = rigById(rigId)
    if (!rig) return

    if (asset.category === 'body') {
      rig.bodyCalibration = { ...calibration }
      rig.updatedAt = Date.now()
      persist()
      return
    }

    if (!isRigConfigurableCategory(asset.category)) return
    let categoryDef = rig.categories.find((c) => c.category === asset.category)
    if (!categoryDef) {
      categoryDef = { category: asset.category, enabled: true }
      rig.categories.push(categoryDef)
    }

    const part = partForAsset(rig, asset)
    if (!part) return

    const isDefault = categoryDef.defaultPartKey === rigAssetKey(part.asset)
    if (isDefault || !categoryDef.template) {
      categoryDef.template = { ...calibration }
      categoryDef.defaultPartKey = rigAssetKey(part.asset)
      part.calibrationOverride = undefined
    } else {
      part.calibrationOverride = { ...calibration }
    }
    rig.updatedAt = Date.now()
    persist()
  }

  function resetPartCalibration(rigId: string, asset: Asset): void {
    const rig = rigById(rigId)
    if (!rig || asset.category === 'body' || !isRigConfigurableCategory(asset.category)) return
    const part = partForAsset(rig, asset)
    if (!part) return
    const categoryDef = rig.categories.find((c) => c.category === asset.category)
    if (categoryDef?.defaultPartKey !== rigAssetKey(part.asset)) {
      part.calibrationOverride = undefined
      rig.updatedAt = Date.now()
      persist()
    }
  }

  function updateBodyCalibration(rigId: string, calibration: AssetCalibration): void {
    const rig = rigById(rigId)
    if (!rig) return
    rig.bodyCalibration = { ...calibration }
    rig.updatedAt = Date.now()
    persist()
  }

  function duplicateRigConfiguration(sourceRigId: string, targetRigId: string): void {
    const sourceRig = rigById(sourceRigId)
    const targetRig = rigById(targetRigId)
    if (!sourceRig || !targetRig || sourceRig.characterKey !== targetRig.characterKey) return

    const updated = duplicateRigConfig(sourceRig, targetRig)
    const index = rigs.value.findIndex((r) => r.id === targetRigId)
    if (index >= 0) {
      rigs.value[index] = updated
    }
    persist()
  }

  function setDefaultRig(characterKey: string, rigId: string): void {
    if (!rigs.value.some((rig) => rig.id === rigId && rig.characterKey === characterKey)) return
    defaultRigByCharacter.value = { ...defaultRigByCharacter.value, [characterKey]: rigId }
    persist()
  }

  function replaceCatalog(file: RigCatalogFile, assets: Asset[]): void {
    rigs.value = JSON.parse(JSON.stringify(file.rigs)) as RigDefinition[]
    defaultRigByCharacter.value = { ...file.defaultRigByCharacter }
    initialize(assets)
  }

  function exportCatalog(): RigCatalogFile {
    return createRigCatalogFile(rigs.value, defaultRigByCharacter.value)
  }

  function importCatalog(raw: string, assets: Asset[]): RigCatalogFile {
    const file = parseRigCatalogFile(raw)
    replaceCatalog(file, assets)
    return file
  }

  function resolvePartAsset(part: RigPartDefinition, assets: Asset[]): Asset | undefined {
    return findAssetByRigIdentity(part.asset, assets)
  }

  function openCalibration(rigId?: string): void {
    selectedRigId.value = rigId ?? selectedRigId.value
    isCalibrationOpen.value = true
  }

  function propagateFieldToCategory(
    rigId: string,
    category: RigConfigurableCategory,
    field: 'x' | 'y' | 'scale' | 'rotation' | 'zIndex',
    value: number
  ): void {
    const rig = rigById(rigId)
    if (!rig) return

    let categoryDef = rig.categories.find((c) => c.category === category)
    if (!categoryDef) {
      categoryDef = { category, enabled: true }
      rig.categories.push(categoryDef)
    }

    if (!categoryDef.template) {
      categoryDef.template = { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 }
    }

    const applyField = (cal: AssetCalibration) => {
      switch (field) {
        case 'x':
          cal.x = Math.round(value)
          break
        case 'y':
          cal.y = Math.round(value)
          break
        case 'scale':
          cal.scaleX = Math.max(0.01, value)
          cal.scaleY = Math.max(0.01, value)
          break
        case 'rotation':
          cal.rotation = value
          break
        case 'zIndex':
          cal.zIndex = Math.round(value)
          break
      }
    }

    applyField(categoryDef.template)

    for (const part of rig.parts) {
      if (part.asset.category === category && part.calibrationOverride) {
        applyField(part.calibrationOverride)
      }
    }

    rig.updatedAt = Date.now()
    persist()
  }

  function closeCalibration(): void {
    isCalibrationOpen.value = false
  }

  return {
    rigs,
    defaultRigByCharacter,
    isCalibrationOpen,
    selectedRigId,
    initialize,
    rigById,
    rigsForCharacter,
    defaultRig,
    categoryForRig,
    compatibleRigs,
    partForAsset,
    effectiveCalibrationForAsset,
    setCategoryEnabled,
    setPartCompatibility,
    setDefaultPart,
    savePartCalibration,
    resetPartCalibration,
    updateBodyCalibration,
    duplicateRigConfiguration,
    propagateFieldToCategory,
    setDefaultRig,
    replaceCatalog,
    exportCatalog,
    importCatalog,
    resolvePartAsset,
    openCalibration,
    closeCalibration
  }
})
