<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, useTemplateRef, watch, type WatchStopHandle } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { seedDemoAssetsIfEmpty } from '@/features/asset-manager/services/demo-asset-seeder'

import StudioHeader from '@/features/project/components/StudioHeader.vue'
import AssetLibraryPanel from '@/features/asset-manager/components/AssetLibraryPanel.vue'
import StudioViewport from '@/features/studio/components/StudioViewport.vue'
import ProjectSettingsModal from '@/features/project/components/ProjectSettingsModal.vue'
import ExportModal from '@/features/project/components/ExportModal.vue'
import ViewportSnapshotsModal from '@/features/editor/components/ViewportSnapshotsModal.vue'
import ResizableSidebar from '@/features/studio/components/ResizableSidebar.vue'
import ToastContainer from '@/components/ui/toast-container/ToastContainer.vue'
import {
  ProductTour,
  type ProductTourExpose,
  type ProductTourStep
} from '@/components/ui/product-tour'

const projectStore = useProjectStore()
const assetStore = useAssetStore()
const editorStore = useEditorStore()
const workspaceBackupStore = useWorkspaceBackupStore()
let stopWorkspaceWatch: WatchStopHandle | null = null

const isSettingsOpen = ref(false)
const isExportOpen = ref(false)
const isSavedSnapshotsOpen = ref(false)
const showAssetLibrary = ref(true)
const productTourRef = useTemplateRef<ProductTourExpose>('productTourRef')

const productTourSteps: ProductTourStep[] = [
  {
    element: '[data-tour="asset-library"]',
    popover: {
      title: '1. Choisissez vos sprites',
      description: 'Cliquez sur un sprite pour l’ajouter. Un autre sprite remplace le même slot et un second clic le retire.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stage"]',
    popover: {
      title: '2. Composez la scène',
      description: 'Déplacez et redimensionnez les personnages comme un ensemble. Leur ratio original est toujours conservé.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '[data-tour="backup"]',
    popover: {
      title: '3. Sauvegardez votre travail',
      description: 'Créez une sauvegarde complète de l’application ou restaurez la dernière version enregistrée.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="export"]',
    popover: {
      title: '4. Exportez votre création',
      description: 'Téléchargez une image PNG haute définition ou la structure de scène en JSON.',
      side: 'bottom',
      align: 'end'
    }
  }
]

onMounted(async () => {
  // 1. Initialiser l'espace de travail unique
  const proj = await projectStore.loadInitialProject()

  // 2. Pré-remplir les assets de démonstration si premier lancement
  await seedDemoAssetsIfEmpty()
  await assetStore.loadAssets()

  // 3. Charger le document courant de l'éditeur
  await editorStore.loadDocument(proj.editorDocumentId, proj.id)

  await workspaceBackupStore.initialize()
  stopWorkspaceWatch = watch(
    [
      () => projectStore.currentProject,
      () => editorStore.currentDocument,
      () => assetStore.assets
    ],
    () => workspaceBackupStore.markDirty(),
    { deep: true }
  )
})

onBeforeUnmount(() => {
  stopWorkspaceWatch?.()
  workspaceBackupStore.dispose()
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-bg-base text-text-primary overflow-hidden font-sans select-none">
    <!-- Barre supérieure de navigation -->
    <StudioHeader
      @open-settings="isSettingsOpen = true"
      @open-export="isExportOpen = true"
      @open-saved-snapshots="isSavedSnapshotsOpen = true"
      @start-tour="productTourRef?.start()"
    />

    <!-- Zone centrale du studio : bibliothèque et viewport -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Bibliothèque d'Assets (Gauche) -->
      <ResizableSidebar
        v-model:open="showAssetLibrary"
        side="left"
        :default-width="460"
        :min-width="360"
        :max-width="680"
        storage-key="berlu.asset-sidebar-width.v2"
      >
        <AssetLibraryPanel v-model:open="showAssetLibrary" />
      </ResizableSidebar>

      <!-- Viewport & Canvas de Composition (Centre, occupant tout l'espace restant) -->
      <StudioViewport />
    </div>

    <!-- Modales Globales -->
    <ProjectSettingsModal v-model:open="isSettingsOpen" />
    <ExportModal v-model:open="isExportOpen" />
    <ViewportSnapshotsModal v-model:open="isSavedSnapshotsOpen" />

    <!-- Système de notifications Toasts & Tour -->
    <ToastContainer />
    <ProductTour
      ref="productTourRef"
      :steps="productTourSteps"
      auto-start
      storage-key="berlu-creator.product-tour.v4"
      :start-delay-ms="1400"
      :config="{ skipMissingElement: true }"
    />
  </div>
</template>
