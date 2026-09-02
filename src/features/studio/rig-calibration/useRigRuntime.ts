import type { Asset, AssetCalibration } from '@core/types/asset.types'
import type { CharacterGroup, EditorLayer } from '@core/types/editor.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore, type CharacterRigLayerPreset } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from './rig-catalog.store'
import {
  assetsShareRigIdentity,
  findAssetByRigIdentity,
  headCalibration,
  isRigSlotCategory,
  rigAssetKey
} from './rig-catalog.service'
import type { RigDefinition } from './rig-catalog.types'

export function useRigRuntime() {
  const assetStore = useAssetStore()
  const editorStore = useEditorStore()
  const rigCatalog = useRigCatalogStore()

  function characterGroup(characterKey: string): CharacterGroup | undefined {
    return editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.kind === 'character' && group.characterKey === characterKey
    )
  }

  function activeRigForGroup(group: CharacterGroup): RigDefinition | undefined {
    const bodyLayer = editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && layer.category === 'body' && !layer.muted
    )
    const bodyAsset = bodyLayer ? assetStore.assets.find((asset) => asset.id === bodyLayer.assetId) : undefined
    if (bodyAsset) {
      const match = rigCatalog.rigs.find((rig) => assetsShareRigIdentity(rig.body, bodyAsset))
      if (match) return match
    }
    return rigCatalog.rigById(group.activeRigId) ?? rigCatalog.defaultRig(group.characterKey)
  }

  function defaultHeadForRig(rig: RigDefinition, selectedAsset?: Asset): Asset | undefined {
    if (selectedAsset?.category === 'head' && rigCatalog.isAssetCompatible(rig, selectedAsset)) {
      return selectedAsset
    }
    for (const config of rig.headSeries.filter((entry) => entry.enabled)) {
      const seriesHeads = assetStore.assets.filter(
        (asset) => asset.category === 'head' && asset.headSeriesId === config.seriesId
      )
      const configured = config.defaultHeadAssetKey
        ? seriesHeads.find((asset) => rigAssetKey(asset) === config.defaultHeadAssetKey)
        : undefined
      if (configured ?? seriesHeads[0]) return configured ?? seriesHeads[0]
    }
    return undefined
  }

  function presetsForRig(rig: RigDefinition, selectedAsset?: Asset): CharacterRigLayerPreset[] {
    const presets: CharacterRigLayerPreset[] = []
    const body = findAssetByRigIdentity(rig.body, assetStore.assets)
    if (body) {
      presets.push({
        assetId: body.id,
        category: 'body',
        name: body.name,
        calibration: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 10 }
      })
    }
    const head = defaultHeadForRig(rig, selectedAsset)
    const series = rigCatalog.seriesById(head?.headSeriesId)
    const placement = head && series ? headCalibration(rig, series, head) : null
    if (head && placement) {
      presets.push({ assetId: head.id, category: 'head', name: head.name, calibration: placement })
    }
    return presets
  }

  function ensureCharacterGroup(rig: RigDefinition): CharacterGroup | undefined {
    const existing = characterGroup(rig.characterKey)
    if (existing) return existing
    const body = findAssetByRigIdentity(rig.body, assetStore.assets)
    if (!body) return undefined
    const layer = editorStore.assignAssetToGroup(body.id, 'body', null, body.name, {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    })
    return editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.id === layer.groupId && group.kind === 'character'
    )
  }

  function activateRig(rig: RigDefinition, selectedAsset?: Asset): EditorLayer | null {
    const group = ensureCharacterGroup(rig)
    if (!group) return null
    return editorStore.applyCharacterRig(group.id, rig.id, presetsForRig(rig, selectedAsset), selectedAsset?.id)
  }

  function targetRigForAsset(asset: Asset, currentRig?: RigDefinition): RigDefinition | undefined {
    const compatible = rigCatalog.compatibleRigs(asset)
    if (currentRig && compatible.some((rig) => rig.id === currentRig.id)) return currentRig
    return compatible[0]
  }

  function preservedHeadCalibration(
    rig: RigDefinition,
    nextHead: Asset,
    currentHeadLayer?: EditorLayer
  ): AssetCalibration | null {
    const nextSeries = rigCatalog.seriesById(nextHead.headSeriesId)
    if (!nextSeries) return null
    const nextBase = headCalibration(rig, nextSeries, nextHead)
    if (!nextBase || !currentHeadLayer) return nextBase
    const currentHead = assetStore.assets.find((asset) => asset.id === currentHeadLayer.assetId)
    if (!currentHead) return nextBase
    if (currentHead.headSeriesId === nextHead.headSeriesId) {
      return {
        ...currentHeadLayer.transform,
        zIndex: currentHeadLayer.zIndex
      }
    }
    const currentSeries = rigCatalog.seriesById(currentHead.headSeriesId)
    const currentBase = currentSeries ? headCalibration(rig, currentSeries, currentHead) : null
    return {
      ...nextBase,
      x: nextBase.x + (currentBase ? currentHeadLayer.transform.x - currentBase.x : 0),
      y: nextBase.y + (currentBase ? currentHeadLayer.transform.y - currentBase.y : 0)
    }
  }

  function selectCharacterAsset(asset: Asset): EditorLayer | null {
    if (!isRigSlotCategory(asset.category)) return null
    if (asset.category === 'body') {
      const rig = rigCatalog.compatibleRigs(asset)[0]
      return rig ? activateRig(rig) : null
    }

    const selectedGroup = editorStore.selectedGroup
    const group =
      selectedGroup?.kind === 'character'
        ? selectedGroup
        : editorStore.currentDocument.groups.find(
            (candidate): candidate is CharacterGroup => candidate.kind === 'character' && candidate.activeMode === 'rig'
          )
    const currentRig = group ? activeRigForGroup(group) : undefined
    const targetRig = targetRigForAsset(asset, currentRig)
    if (!targetRig) return null
    const targetGroup = group ?? ensureCharacterGroup(targetRig)
    if (!targetGroup) return null

    if (asset.category === 'head') {
      const currentHeadLayer = editorStore.currentDocument.layers.find(
        (layer) => layer.groupId === targetGroup.id && layer.category === 'head' && !layer.muted
      )
      const calibration = preservedHeadCalibration(targetRig, asset, currentHeadLayer)
      if (!calibration) return null
      const oldSeriesId = currentHeadLayer
        ? assetStore.assets.find((candidate) => candidate.id === currentHeadLayer.assetId)?.headSeriesId
        : undefined
      if (oldSeriesId && oldSeriesId !== asset.headSeriesId) {
        for (const layer of [...editorStore.currentDocument.layers]) {
          if (layer.groupId === targetGroup.id && layer.category === 'mouth') editorStore.removeLayer(layer.id)
        }
        const nextSeries = rigCatalog.seriesById(asset.headSeriesId)
        const defaultMouth = nextSeries?.defaultMouthAssetKey
          ? assetStore.assets.find(
              (candidate) =>
                candidate.category === 'mouth' &&
                candidate.headSeriesId === nextSeries.id &&
                rigAssetKey(candidate) === nextSeries.defaultMouthAssetKey
            )
          : undefined
        if (defaultMouth) {
          editorStore.assignAssetToGroup(
            defaultMouth.id,
            'mouth',
            targetGroup.id,
            defaultMouth.name
          )
        }
      }
      return editorStore.assignAssetToGroup(asset.id, 'head', targetGroup.id, asset.name, calibration)
    }

    if (asset.category === 'mouth') {
      const activeHead = editorStore.currentDocument.layers.find(
        (layer) => layer.groupId === targetGroup.id && layer.category === 'head' && !layer.muted
      )
      const head = activeHead ? assetStore.assets.find((candidate) => candidate.id === activeHead.assetId) : undefined
      if (!head || head.headSeriesId !== asset.headSeriesId) return null
    }

    return editorStore.assignAssetToGroup(asset.id, asset.category, targetGroup.id, asset.name)
  }

  function syncRigLayers(rigId: string): void {
    const rig = rigCatalog.rigById(rigId)
    if (!rig) return

    for (const group of editorStore.currentDocument.groups) {
      if (group.kind !== 'character' || group.activeMode !== 'rig') continue
      const activeRig = activeRigForGroup(group)
      if (!activeRig || activeRig.id !== rig.id) continue

      const headLayer = editorStore.currentDocument.layers.find(
        (l) => l.groupId === group.id && l.category === 'head' && !l.muted
      )
      if (!headLayer) continue

      const headAsset = assetStore.assets.find((a) => a.id === headLayer.assetId)
      const series = rigCatalog.seriesById(headAsset?.headSeriesId)
      if (!headAsset || !series) continue

      const config = rig.headSeries.find((entry) => entry.seriesId === series.id)
      const placement = headCalibration(rig, series, headAsset)
      if (!placement) continue

      editorStore.updateLayerTransform(headLayer.id, {
        x: placement.x,
        y: placement.y,
        scaleX: config?.defaultScale ?? placement.scaleX ?? 1,
        scaleY: config?.defaultScale ?? placement.scaleY ?? 1,
        rotation: config?.defaultRotation ?? placement.rotation ?? 0
      })
    }
  }

  return {
    characterGroup,
    activeRigForGroup,
    presetsForRig,
    activateRig,
    targetRigForAsset,
    selectCharacterAsset,
    syncRigLayers
  }
}
