import type { AssetCategory } from '@core/types/asset.types'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from './rig-catalog.store'
import { isRigConfigurableCategory } from './rig-catalog.service'

type RigConfigurableCategory = Extract<AssetCategory, 'head' | 'mouth' | 'props_character'>

export interface CalibrationSelection {
  category: RigConfigurableCategory
  assetId: string
  groupId?: string | null
}

export function useRigCalibrationSelection() {
  const assetStore = useAssetStore()
  const editorStore = useEditorStore()
  const rigCatalog = useRigCatalogStore()

  function selectCalibrationAsset(selection: CalibrationSelection): boolean {
    const asset = assetStore.assets.find((candidate) => candidate.id === selection.assetId)
    if (
      !asset ||
      asset.category !== (selection.category as AssetCategory) ||
      !isRigConfigurableCategory(asset.category)
    ) {
      return false
    }

    if (rigCatalog.calibrationTargetId !== asset.id) {
      rigCatalog.calibrationTargetId = asset.id
    }
    rigCatalog.calibrationTool =
      asset.category === 'props_character' || asset.category === 'mouth'
        ? 'accessory'
        : 'head'
    if (assetStore.selectedAssetId !== asset.id) {
      assetStore.selectAsset(asset.id)
    }

    if (rigCatalog.isCalibrationOpen) {
      const layer = editorStore.currentDocument.layers.find(
        (candidate) =>
          candidate.assetId === asset.id &&
          candidate.category === asset.category &&
          (!selection.groupId || candidate.groupId === selection.groupId)
      )
      if (layer && editorStore.selectedLayerId !== layer.id) {
        editorStore.selectRigLayerForCalibration(layer.id)
      }
    }

    return true
  }

  return { selectCalibrationAsset }
}
