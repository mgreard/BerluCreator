<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch, type WatchStopHandle } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { syncBundledAssets } from '@/features/asset-manager/services/demo-asset-seeder'

import AssetCategoryNav from '@/features/asset-manager/components/AssetCategoryNav.vue'
import AssetCategoryDrawer from '@/features/asset-manager/components/AssetCategoryDrawer.vue'
import type { ActiveSelection } from '@/features/asset-manager/types/asset-nav.types'
import StudioViewport from '@/features/studio/components/StudioViewport.vue'
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
const activeAssetSelection = ref<ActiveSelection>({ type: 'all' })
const showAssetDrawer = ref(true)

const {
  currentSteps,
  currentStorageKey,
  tourRef,
  startTour
} = useProductTourManager(
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
  // 1. Initialiser l'espace de travail unique
  const proj = await projectStore.loadInitialProject()

  // 2. Synchroniser les nouveaux sprites livrés sans toucher aux imports personnels
  await syncBundledAssets()
  await assetStore.loadAssets()
  rigCatalogStore.initialize(assetStore.assets)

  // 3. Charger le document courant de l'éditeur
  await editorStore.loadDocument(proj.editorDocumentId, proj.id)
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
</script>

<template>
  <div
    class="h-screen w-screen flex bg-bg-base text-text-primary overflow-hidden font-sans select-none"
  >
    <!-- Rail de Catégories (Permanent à gauche, pleine hauteur) -->
    <AssetCategoryNav
      v-model:selection="activeAssetSelection"
      v-model:drawer-open="showAssetDrawer"
      data-tour="asset-library"
    />

    <!-- Viewport & Canvas de Composition (Occupe tout l'espace restant) -->
    <div
      class="relative flex-1 h-full overflow-hidden"
      @pointerdown="showAssetDrawer = false"
    >
      <StudioViewport
        :is-saved-snapshots-open="isSavedSnapshotsOpen"
        @open-settings="isSettingsOpen = true"
        @open-export="isExportOpen = true"
        @toggle-saved-snapshots="isSavedSnapshotsOpen = !isSavedSnapshotsOpen"
        @start-tour="(key) => startTour(key)"
      />

      <!-- Tiroir des assets d'une catégorie en Glassmorphism (Flottant sur le viewport à gauche) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-x-4 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 -translate-x-4 scale-95"
      >
        <AssetCategoryDrawer
          v-if="showAssetDrawer"
          v-model:open="showAssetDrawer"
          :selection="activeAssetSelection"
        />
      </Transition>

      <!-- Panneau des compositions en Glassmorphism (Flottant sur le viewport à droite) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-x-4 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0 scale-100"
        leave-to-class="opacity-0 translate-x-4 scale-95"
      >
        <ViewportSnapshotsPanel
          v-if="isSavedSnapshotsOpen"
          v-model:open="isSavedSnapshotsOpen"
        />
      </Transition>
    </div>

    <ResizableSidebar
      v-if="rigCatalogStore.isCalibrationOpen"
      v-model:open="rigCatalogStore.isCalibrationOpen"
      side="right"
      :default-width="420"
      :min-width="360"
      :max-width="560"
      storage-key="berlu.rig-calibration-sidebar-width.v1"
    >
      <RigCalibrationWorkspace />
    </ResizableSidebar>

    <!-- Modales Globales -->
    <ProjectSettingsModal v-model:open="isSettingsOpen" />
    <ExportModal v-model:open="isExportOpen" />

    <!-- Système de notifications Toasts & Tour -->
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
