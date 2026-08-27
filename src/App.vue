<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, useTemplateRef, watch, type WatchStopHandle } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { seedDemoAssetsIfEmpty } from '@/features/asset-manager/services/demo-asset-seeder'

import StudioHeader from '@/features/project/components/StudioHeader.vue'
import AssetLibraryPanel from '@/features/asset-manager/components/AssetLibraryPanel.vue'
import StudioViewport from '@/features/studio/components/StudioViewport.vue'
import HierarchyInspector from '@/features/studio/components/HierarchyInspector.vue'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import ProjectSettingsModal from '@/features/project/components/ProjectSettingsModal.vue'
import ExportSequenceModal from '@/features/project/components/ExportSequenceModal.vue'
import SavedKeyframesModal from '@/features/timeline/components/SavedKeyframesModal.vue'
import ResizableSidebar from '@/features/studio/components/ResizableSidebar.vue'
import ToastContainer from '@/components/ui/toast-container/ToastContainer.vue'
import {
  ProductTour,
  type ProductTourExpose,
  type ProductTourStep
} from '@/components/ui/product-tour'

const projectStore = useProjectStore()
const assetStore = useAssetStore()
const timelineStore = useTimelineStore()
const workspaceBackupStore = useWorkspaceBackupStore()
let stopWorkspaceWatch: WatchStopHandle | null = null

const isSettingsOpen = ref(false)
const isExportOpen = ref(false)
const isSavedKeyframesOpen = ref(false)
const showHierarchy = ref(true)
const showAssetLibrary = ref(true)
const productTourRef = useTemplateRef<ProductTourExpose>('productTourRef')

const productTourSteps: ProductTourStep[] = [
  {
    element: '[data-tour="asset-library"]',
    popover: {
      title: '1. Choisissez vos sprites',
      description: 'Filtrez la bibliothèque puis cliquez sur un sprite pour l’ajouter à la piste ou au groupe actif.',
      side: 'right',
      align: 'start'
    }
  },
  {
    element: '[data-tour="stage"]',
    popover: {
      title: '2. Composez la scène',
      description: 'Déplacez et redimensionnez les éléments. Le mode « Groupe entier » transforme tous les enfants ensemble.',
      side: 'left',
      align: 'center'
    }
  },
  {
    element: '[data-tour="hierarchy"]',
    popover: {
      title: '3. Organisez les groupes',
      description: 'Sélectionnez un groupe cible, configurez ses calques ou supprimez-le avec confirmation.',
      side: 'left',
      align: 'start'
    }
  },
  {
    element: '[data-tour="timeline"]',
    popover: {
      title: '4. Construisez votre séquence',
      description: 'Ajoutez des étapes autonomes : chacune conserve une copie complète et indépendante de la scène.',
      side: 'top',
      align: 'center'
    }
  },
  {
    element: '[data-tour="backup"]',
    popover: {
      title: '5. Sauvegardez votre travail',
      description: 'Créez une sauvegarde complète de l’application ou restaurez la dernière version enregistrée.',
      side: 'bottom',
      align: 'end'
    }
  },
  {
    element: '[data-tour="export"]',
    popover: {
      title: '6. Exportez les changements',
      description: 'Téléchargez une étape, les données JSON ou une archive des changements nommés séquentiellement.',
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

  // 3. Charger la séquence active
  await timelineStore.loadSequence(proj.activeSequenceId, proj.id)

  await workspaceBackupStore.initialize()
  stopWorkspaceWatch = watch(
    [
      () => projectStore.currentProject,
      () => timelineStore.currentSequence,
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
      @open-saved-keyframes="isSavedKeyframesOpen = true"
      @start-tour="productTourRef?.start()"
    />

    <!-- Zone Centrale du Studio (3 Colonnes) -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Bibliothèque d'Assets (Gauche) -->
      <ResizableSidebar
        v-model:open="showAssetLibrary"
        side="left"
        :default-width="370"
        :min-width="300"
        :max-width="560"
        storage-key="berlu.asset-sidebar-width"
      >
        <AssetLibraryPanel v-model:open="showAssetLibrary" />
      </ResizableSidebar>

      <!-- Viewport & Canvas de Composition (Centre) -->
      <StudioViewport />

      <!-- Inspecteur de Hiérarchie des Calques (Droite) -->
      <ResizableSidebar
        v-model:open="showHierarchy"
        side="right"
        :default-width="320"
        :min-width="260"
        :max-width="520"
        storage-key="berlu.hierarchy-sidebar-width"
      >
        <HierarchyInspector v-model:open="showHierarchy" />
      </ResizableSidebar>
    </div>

    <!-- Séquenceur & Timeline Discrète (Bas) -->
    <TimelinePanel />

    <!-- Modales Globales -->
    <ProjectSettingsModal v-model:open="isSettingsOpen" />
    <ExportSequenceModal v-model:open="isExportOpen" />
    <SavedKeyframesModal v-model:open="isSavedKeyframesOpen" />

    <!-- Système de notifications Toasts -->
    <ToastContainer />
    <ProductTour
      ref="productTourRef"
      :steps="productTourSteps"
      auto-start
      storage-key="berlu-creator.product-tour.v2"
      :start-delay-ms="1400"
      :config="{ skipMissingElement: true }"
    />
  </div>
</template>
