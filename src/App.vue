<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch, type WatchStopHandle } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { syncBundledAssets } from '@/features/asset-manager/services/demo-asset-seeder'

import AssetLibraryPanel from '@/features/asset-manager/components/AssetLibraryPanel.vue'
import StudioViewport from '@/features/studio/components/StudioViewport.vue'
import {
  StudioWorkspaceLayout,
  type StudioWorkspacePane
} from '@/features/studio/components/studio-workspace-layout'
import ProjectSettingsModal from '@/features/project/components/ProjectSettingsModal.vue'
import ExportModal from '@/features/project/components/ExportModal.vue'
import { ViewportSnapshotsPanel } from '@/features/editor/components/viewport-snapshots-panel'
import ResizableSidebar from '@/features/studio/components/ResizableSidebar.vue'
import RigCalibrationWorkspace from '@/features/studio/components/RigCalibrationWorkspace.vue'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import ToastContainer from '@/components/ui/toast-container/ToastContainer.vue'
import { ProductTour } from '@/components/ui/product-tour'
import { useProductTourManager } from '@/features/project/composables/useProductTourManager'

const projectStore = useProjectStore()
const assetStore = useAssetStore()
const editorStore = useEditorStore()
const workspaceBackupStore = useWorkspaceBackupStore()
const rigCatalogStore = useRigCatalogStore()
let stopWorkspaceWatch: WatchStopHandle | null = null
let stopRigCatalogWatch: WatchStopHandle | null = null

const isSettingsOpen = ref(false)
const isExportOpen = ref(false)
const isSavedSnapshotsOpen = ref(false)
const showAssetDrawer = ref(true)
const compactPane = ref<StudioWorkspacePane>('studio')

const { currentSteps, currentStorageKey, tourRef, startTour } = useProductTourManager(
  () => rigCatalogStore.isCalibrationOpen,
  () => isSavedSnapshotsOpen.value,
  () => isExportOpen.value,
  {
    openRigCalibration: () => {
      rigCatalogStore.isCalibrationOpen = true
    },
    openSavedSnapshots: () => {
      isSavedSnapshotsOpen.value = true
    },
    openExport: () => {
      isExportOpen.value = true
    }
  }
)

onMounted(async () => {
  const project = await projectStore.loadInitialProject()

  await syncBundledAssets()
  await assetStore.loadAssets()
  rigCatalogStore.initialize(assetStore.assets)

  await editorStore.loadDocument(project.editorDocumentId, project.id)
  if (!editorStore.currentDocument.rigCatalogSnapshot) {
    editorStore.syncRigCatalogSnapshot(JSON.stringify(rigCatalogStore.exportCatalog()))
  }
  stopRigCatalogWatch = watch(
    [() => rigCatalogStore.rigs, () => rigCatalogStore.defaultRigByCharacter],
    () => editorStore.syncRigCatalogSnapshot(JSON.stringify(rigCatalogStore.exportCatalog())),
    { deep: true }
  )

  await workspaceBackupStore.initialize()
  stopWorkspaceWatch = watch(
    [
      () => projectStore.currentProject,
      () => editorStore.currentDocument,
      () => assetStore.assets,
      () => rigCatalogStore.rigs,
      () => rigCatalogStore.defaultRigByCharacter
    ],
    () => workspaceBackupStore.markDirty(),
    { deep: true }
  )
})

onBeforeUnmount(() => {
  stopWorkspaceWatch?.()
  stopRigCatalogWatch?.()
  workspaceBackupStore.dispose()
})

watch(
  () => rigCatalogStore.isCalibrationOpen,
  (open) => {
    if (open) isSavedSnapshotsOpen.value = false
  }
)

watch(isSavedSnapshotsOpen, (open) => {
  if (open) rigCatalogStore.closeCalibration()
})

watch(
  [isSavedSnapshotsOpen, () => rigCatalogStore.isCalibrationOpen],
  ([snapshotsOpen, calibrationOpen]) => {
    if (snapshotsOpen || calibrationOpen) compactPane.value = 'inspector'
    else if (compactPane.value === 'inspector') compactPane.value = 'studio'
  }
)

function handleProjectMenuOpen(open: boolean): void {
  if (open) showAssetDrawer.value = false
}
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 flex-col overflow-hidden bg-bg-base font-sans text-text-primary select-none"
  >
    <StudioWorkspaceLayout v-model:compact-pane="compactPane">
      <template #left>
        <AssetLibraryPanel
          v-model:open="showAssetDrawer"
          data-tour="asset-library"
          @open-settings="isSettingsOpen = true"
          @project-menu-open="handleProjectMenuOpen"
        />
      </template>

      <div class="size-full h-screen min-h-0 min-w-0 overflow-hidden" @pointerdown="showAssetDrawer = false">
        <StudioViewport
          :is-saved-snapshots-open="isSavedSnapshotsOpen"
          @open-export="isExportOpen = true"
          @toggle-saved-snapshots="isSavedSnapshotsOpen = !isSavedSnapshotsOpen"
          @start-tour="(key) => startTour(key)"
        />
      </div>

      <template v-if="isSavedSnapshotsOpen || rigCatalogStore.isCalibrationOpen" #right>
        <ResizableSidebar
          v-if="isSavedSnapshotsOpen"
          v-model:open="isSavedSnapshotsOpen"
          side="right"
          :default-width="380"
          :min-width="320"
          :max-width="520"
          storage-key="berlu.saved-snapshots-sidebar-width.v1"
        >
          <ViewportSnapshotsPanel v-model:open="isSavedSnapshotsOpen" />
        </ResizableSidebar>

        <ResizableSidebar
          v-else
          v-model:open="rigCatalogStore.isCalibrationOpen"
          side="right"
          :default-width="420"
          :min-width="360"
          :max-width="560"
          storage-key="berlu.rig-calibration-sidebar-width.v1"
        >
          <RigCalibrationWorkspace />
        </ResizableSidebar>
      </template>
    </StudioWorkspaceLayout>

    <ProjectSettingsModal v-model:open="isSettingsOpen" />
    <ExportModal v-model:open="isExportOpen" />

    <ToastContainer />
    <ProductTour
      ref="tourRef"
      :steps="currentSteps"
      auto-start
      :storage-key="currentStorageKey"
      :start-delay-ms="1400"
      :config="{ skipMissingElement: true }"
    />
  </div>
</template>
