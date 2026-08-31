<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import type { CharacterGroup } from '@core/types/editor.types'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { toast } from '@/ui/shared/services/toast.service'
import WorkspaceBackupMenu from '@/features/project/components/WorkspaceBackupMenu.vue'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { useRigRuntime } from '@/features/studio/rig-calibration/useRigRuntime'
import { CHARACTER_CATEGORIES } from '../../types/asset-nav.types'
import { useAssetStore } from '../../stores/useAssetStore'
import AssetUploadModal from '../AssetUploadModal.vue'
import type { AssetLibraryGlobalActionsEmits } from './types'

const emit = defineEmits<AssetLibraryGlobalActionsEmits>()

const assetStore = useAssetStore()
const editorStore = useEditorStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()
const isUploadModalOpen = ref(false)

const uploadInitialCategory = computed<AssetCategory | null>(() => {
  const selection = assetStore.librarySelection
  if (selection.type === 'stage') return selection.category
  if (selection.type !== 'character') return null
  const definition = CHARACTER_CATEGORIES.find((entry) => entry.id === selection.categoryId)
  return definition?.category ?? 'character_full'
})

const uploadInitialCharacterKey = computed<string | null>(() =>
  assetStore.librarySelection.type === 'character' ? assetStore.librarySelection.characterKey : null
)

function toggleRigCalibration(): void {
  if (rigCatalog.isCalibrationOpen) {
    rigCatalog.closeCalibration()
    const selectedGroup = editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup =>
        group.kind === 'character' && group.id === editorStore.selectedGroupId
    )
    if (selectedGroup) editorStore.selectGroupForEditing(selectedGroup.id)
    return
  }

  const group =
    editorStore.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.kind === 'character' && candidate.id === editorStore.selectedGroupId
    ) ??
    editorStore.currentDocument.groups.find(
      (candidate): candidate is CharacterGroup =>
        candidate.kind === 'character' && candidate.activeMode === 'rig'
    )
  if (!group) return

  const rig = rigRuntime.activeRigForGroup(group) ?? rigCatalog.defaultRig(group.characterKey)
  if (!rig) {
    toast.warning('Rig indisponible', 'Aucune configuration de corps n’est disponible.')
    return
  }

  let preferredLayer =
    editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && !layer.muted && layer.category === 'body'
    ) ??
    editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && !layer.muted && layer.category !== 'character_full'
    )
  if (!preferredLayer || group.activeMode !== 'rig') {
    preferredLayer = rigRuntime.activateRig(rig) ?? undefined
  }
  if (!preferredLayer) return

  rigCatalog.selectedRigId = rig.id
  rigCatalog.openCalibration(rig.id)
  editorStore.selectRigLayerForCalibration(preferredLayer.id)
  assetStore.selectAsset(preferredLayer.assetId)
}
</script>

<template>
  <div
    class="flex shrink-0 items-center gap-1 rounded-lg border border-border-default bg-bg-surface p-0.5"
    data-studio-primary-actions
    role="group"
    aria-label="Projet et bibliothèque"
  >
    <!-- Logo Compact Incroyaux News Studio -->
    <div
      class="flex items-center gap-1 px-2 py-0.5 select-none"
      title="Incroyaux News Studio"
      aria-label="Incroyaux News Studio"
    >
      <svg
        viewBox="0 0 240 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="h-4.5 w-auto transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="header-logo-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FEF08A" />
            <stop offset="100%" stop-color="#EAB308" />
          </linearGradient>
          <linearGradient id="header-logo-purple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#F0ABFC" />
            <stop offset="100%" stop-color="#A855F7" />
          </linearGradient>
        </defs>
        <text
          x="0"
          y="26"
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
          font-size="22"
          font-weight="900"
          letter-spacing="-0.03em"
          fill="url(#header-logo-yellow)"
        >
          Incroyaux
        </text>
        <text
          x="110"
          y="26"
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
          font-size="22"
          font-weight="900"
          letter-spacing="-0.03em"
          fill="url(#header-logo-purple)"
        >
          News
        </text>
        <text
          x="178"
          y="26"
          font-family="'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif"
          font-size="10"
          font-weight="800"
          letter-spacing="0.18em"
          fill="#FFFFFF"
          opacity="0.9"
        >
          STUDIO
        </text>
      </svg>
    </div>

    <div class="mx-0.5 h-4 w-px bg-border-default shrink-0" aria-hidden="true" />

    <WorkspaceBackupMenu
      placement="header"
      @open-settings="emit('openSettings')"
      @open-change="emit('projectMenuOpen', $event)"
    />

    <Button
      data-library-action="import"
      variant="ghost"
      size="xs"
      class="h-7 gap-1.5 px-2 text-[11px] font-medium"
      title="Importer des sprites"
      @click="isUploadModalOpen = true"
    >
      <Icon name="cloud_upload" size="xs" class="text-primary" />
      <span>Importer</span>
    </Button>

    <Button
      data-library-action="rigs"
      variant="ghost"
      size="xs"
      class="h-7 gap-1.5 px-2 text-[11px] font-medium"
      :class="rigCatalog.isCalibrationOpen ? 'bg-primary/15 text-text-primary' : undefined"
      :aria-pressed="rigCatalog.isCalibrationOpen"
      title="Calibrer les rigs de personnages"
      @click="toggleRigCalibration"
    >
      <Icon name="construction" size="xs" class="text-primary" />
      <span>Rigs</span>
    </Button>

    <Button
      data-library-action="batch-export"
      variant="ghost"
      size="xs"
      class="h-7 gap-1.5 px-2 text-[11px] font-medium"
      title="Galerie d’exportation HD des assets & rigs (ZIP)"
      @click="emit('openBatchExport')"
    >
      <Icon name="folder_zip" size="xs" class="text-primary" />
      <span>Export HD</span>
    </Button>
  </div>

  <AssetUploadModal
    v-model:open="isUploadModalOpen"
    :initial-category="uploadInitialCategory"
    :initial-character-key="uploadInitialCharacterKey"
  />
</template>
