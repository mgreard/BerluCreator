<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch, type WatchStopHandle } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { syncBundledAssets } from '@/features/asset-manager/services/demo-asset-seeder'

import { AssetLibraryPanel } from '@/features/asset-manager/components/asset-library-panel'
import { AssetLibraryGlobalActions } from '@/features/asset-manager/components/asset-library-global-actions'
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
import { SplashScreen } from '@/components/ui/splash-screen'
import { useProductTourManager } from '@/features/project/composables/useProductTourManager'

const isAppLoading = ref(true)
const splashStatus = ref('Initialisation du studio...')
const splashProgress = ref<number | undefined>(15)

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
const isAssetLibraryOpen = ref(true)
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
  try {
    splashStatus.value = 'Initialisation du projet...'
    splashProgress.value = 25
    const project = await projectStore.loadInitialProject()

    splashStatus.value = 'Synchronisation des assets 2D & 3D...'
    splashProgress.value = 55
    await syncBundledAssets()
    await assetStore.loadAssets()
    rigCatalogStore.initialize(assetStore.assets)

    splashStatus.value = 'Préparation de l’espace de travail...'
    splashProgress.value = 80
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

    splashStatus.value = 'Studio prêt !'
    splashProgress.value = 100
  } finally {
    // Déclenche l'animation de sortie fluide
    isAppLoading.value = false
  }
})

onBeforeUnmount(() => {
  stopWorkspaceWatch?.()
  stopRigCatalogWatch?.()
  workspaceBackupStore.dispose()
})

watch(
  () => rigCatalogStore.isCalibrationOpen,
  (open) => {
    if (open) {
      isSavedSnapshotsOpen.value = false
      isAssetLibraryOpen.value = true
    }
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
</script>

<template>
  <div
    class="flex min-h-0 min-w-0 flex-col overflow-hidden bg-bg-base font-sans text-text-primary select-none"
  >
    <StudioWorkspaceLayout v-model:compact-pane="compactPane">
      <template #header>
        <div
          class="flex min-h-12 w-full min-w-0 items-center bg-bg-elevated pl-3"
          data-studio-header
        >
          <AssetLibraryGlobalActions @open-settings="isSettingsOpen = true" />
          <div class="mx-2 h-5 w-px shrink-0 bg-border-default" aria-hidden="true" />
          <div id="studio-global-toolbar-host" class="min-w-0 flex-1 self-stretch" />
        </div>
      </template>

      <template #left>
        <ResizableSidebar
          v-model:open="isAssetLibraryOpen"
          side="left"
          :default-width="400"
          :min-width="320"
          :max-width="520"
          storage-key="berlu.asset-library-sidebar-width.v1"
        >
          <AssetLibraryPanel v-model:open="isAssetLibraryOpen" data-tour="asset-library" />
        </ResizableSidebar>
      </template>

      <div class="size-full h-screen min-h-0 min-w-0 overflow-hidden">
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

    <SplashScreen
      :is-loading="isAppLoading"
      :status-message="splashStatus"
      :progress="splashProgress"
      :min-duration-ms="1100"
    />
  </div>
</template>
