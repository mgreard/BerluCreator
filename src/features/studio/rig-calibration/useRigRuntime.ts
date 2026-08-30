import type { Asset } from '@core/types/asset.types'
import type { CharacterGroup, EditorLayer } from '@core/types/editor.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import {
  useEditorStore,
  type CharacterRigLayerPreset
} from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from './rig-catalog.store'
import {
  assetsShareRigIdentity,
  effectiveCalibration,
  findAssetByRigIdentity,
  isRigSlotCategory,
  partCalibrationToAbsolute,
  rigAssetKey
} from './rig-catalog.service'
import type { RigDefinition } from './rig-catalog.types'

export function useRigRuntime() {
  const assetStore = useAssetStore()
  const editorStore = useEditorStore()
  const rigCatalog = useRigCatalogStore()

  function characterGroup(characterKey: string): CharacterGroup | undefined {
    return editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup =>
        group.kind === 'character' && group.characterKey === characterKey
    )
  }

  function activeRigForGroup(group: CharacterGroup): RigDefinition | undefined {
    const bodyLayer = editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && layer.category === 'body' && !layer.muted
    )
    const bodyAsset = bodyLayer
      ? assetStore.assets.find((asset) => asset.id === bodyLayer.assetId)
      : undefined
    if (bodyAsset) {
      const match = rigCatalog
        .rigsForCharacter(group.characterKey)
        .find((rig) => assetsShareRigIdentity(rig.body, bodyAsset))
      if (match) return match
    }

    const explicit = rigCatalog.rigById(group.activeRigId)
    if (explicit) return explicit

    return rigCatalog.defaultRig(group.characterKey)
  }

  function presetsForRig(rig: RigDefinition, selectedAsset?: Asset): CharacterRigLayerPreset[] {
    const presets: CharacterRigLayerPreset[] = []

    // 1. Corps racine
    const bodyAsset = findAssetByRigIdentity(rig.body, assetStore.assets)
    if (bodyAsset) {
      presets.push({
        assetId: bodyAsset.id,
        category: bodyAsset.category,
        name: bodyAsset.name,
        calibration: { ...rig.bodyCalibration }
      })
    }

    // 2. Pièces configurables actives (Têtes, etc.)
    for (const categoryDef of rig.categories) {
      if (!categoryDef.enabled) continue

      if (selectedAsset && selectedAsset.category === categoryDef.category) {
        const selectedPart = rigCatalog.partForAsset(rig, selectedAsset)
        if (selectedPart) {
          const relativeCalibration = effectiveCalibration(rig, selectedPart, selectedAsset)
          if (relativeCalibration) {
            presets.push({
              assetId: selectedAsset.id,
              category: selectedAsset.category,
              name: selectedAsset.name,
              calibration: partCalibrationToAbsolute(rig, relativeCalibration)
            })
            continue
          }
        }
      }

      if (categoryDef.defaultPartKey) {
        const defaultPart = rig.parts.find(
          (part) => rigAssetKey(part.asset) === categoryDef.defaultPartKey
        )
        if (defaultPart) {
          const defaultAsset = rigCatalog.resolvePartAsset(defaultPart, assetStore.assets)
          if (defaultAsset) {
            const relativeCalibration = effectiveCalibration(rig, defaultPart, defaultAsset)
            if (relativeCalibration) {
              presets.push({
                assetId: defaultAsset.id,
                category: defaultAsset.category,
                name: defaultAsset.name,
                calibration: partCalibrationToAbsolute(rig, relativeCalibration)
              })
            }
          }
        }
      }
    }

    return presets
  }

  function ensureCharacterGroup(rig: RigDefinition): CharacterGroup | undefined {
    const existing = characterGroup(rig.characterKey)
    if (existing) return existing
    const bodyAsset = findAssetByRigIdentity(rig.body, assetStore.assets)
    if (!bodyAsset) return undefined
    const layer = editorStore.assignAssetToGroup(
      bodyAsset.id,
      bodyAsset.category,
      null,
      bodyAsset.name,
      { ...rig.bodyCalibration }
    )
    return editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.id === layer.groupId && group.kind === 'character'
    )
  }

  function activateRig(rig: RigDefinition, selectedAsset?: Asset): EditorLayer | null {
    const group = ensureCharacterGroup(rig)
    if (!group) return null
    return editorStore.applyCharacterRig(
      group.id,
      rig.id,
      presetsForRig(rig, selectedAsset),
      selectedAsset?.id
    )
  }

  function targetRigForAsset(asset: Asset, currentRig?: RigDefinition): RigDefinition | undefined {
    const compatible = rigCatalog.compatibleRigs(asset)
    if (currentRig && compatible.some((rig) => rig.id === currentRig.id)) return currentRig
    const defaultRig = asset.character ? rigCatalog.defaultRig(asset.character.key) : undefined
    return compatible.find((rig) => rig.id === defaultRig?.id) ?? compatible[0]
  }

  function selectCharacterAsset(asset: Asset): EditorLayer | null {
    if (!asset.character || !isRigSlotCategory(asset.category)) return null
    const group = characterGroup(asset.character.key)
    const currentRig = group ? activeRigForGroup(group) : undefined
    const targetRig = targetRigForAsset(asset, currentRig)
    if (!targetRig) return null

    if (asset.category === 'body') {
      return activateRig(targetRig)
    }

    const categoryDef = targetRig.categories.find((c) => c.category === asset.category)
    if (!categoryDef?.enabled) return null

    const hasActiveBody = Boolean(
      group &&
      editorStore.currentDocument.layers.some(
        (layer) => layer.groupId === group.id && layer.category === 'body' && !layer.muted
      )
    )

    if (group && hasActiveBody && currentRig?.id === targetRig.id) {
      const part = rigCatalog.partForAsset(targetRig, asset)
      if (!part) return null
      const relativeCalibration = effectiveCalibration(targetRig, part, asset)
      if (!relativeCalibration) return null

      if (group.activeRigId !== targetRig.id) {
        editorStore.updateGroup(group.id, { activeRigId: targetRig.id })
      }
      return editorStore.assignAssetToGroup(
        asset.id,
        asset.category,
        group.id,
        asset.name,
        partCalibrationToAbsolute(targetRig, relativeCalibration)
      )
    }

    return activateRig(targetRig, asset)
  }

  return {
    characterGroup,
    activeRigForGroup,
    presetsForRig,
    activateRig,
    targetRigForAsset,
    selectCharacterAsset
  }
}
