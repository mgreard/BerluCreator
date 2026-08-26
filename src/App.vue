<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, useTemplateRef, watch, type WatchStopHandle } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { seedDemoAssetsIfEmpty } from '@/features/asset-manager/services/demo-asset-seeder'
import type { Asset, AssetCategory } from '@core/types/asset.types'

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
      description: 'Ajoutez des étapes discrètes et ne renseignez que les pistes dont l’état change.',
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

function addInitialKeyframe(
  category: AssetCategory,
  asset: Asset | undefined,
  stepId: string
) {
  if (!asset) return
  const track = timelineStore.currentSequence.tracks.find(
    (candidate) => candidate.targetSlot === category || candidate.category === category
  )
  if (track) timelineStore.addKeyframe(track.id, stepId, asset.id, asset.name)
}

onMounted(async () => {
  // 1. Initialiser l'espace de travail unique
  const proj = await projectStore.loadInitialProject()

  // 2. Pré-remplir les assets de démonstration si premier lancement
  await seedDemoAssetsIfEmpty()
  await assetStore.loadAssets()

  // 3. Charger la séquence active
  await timelineStore.loadSequence(proj.activeSequenceId, proj.id)

  // 4. Si la séquence n'a aucune keyframe ou utilise des IDs obsolètes, configurer une composition initiale
  const hasValidKeyframes = timelineStore.currentSequence.tracks.some((t) =>
    t.keyframes.some((keyframe) =>
      keyframe.sprites.some((sprite) =>
        assetStore.assets.some((asset) => asset.id === sprite.assetId)
      )
    )
  )

  if (!hasValidKeyframes && assetStore.assets.length > 0) {
    const background =
      assetStore.assets.find((a) => a.category === 'background' && a.name.toLowerCase().includes('background')) ||
      assetStore.assets.find((a) => a.category === 'background')
    const torso = assetStore.assets.find((a) => a.category === 'torso')
    const head =
      assetStore.assets.find((a) => a.category === 'head' && a.name.toLowerCase().includes('smile')) ||
      assetStore.assets.find((a) => a.category === 'head')
    const mouth1 =
      assetStore.assets.find((a) => a.category === 'mouth' && a.name.toLowerCase().includes('smile1')) ||
      assetStore.assets.find((a) => a.category === 'mouth')
    const mouth2 = assetStore.assets.find((a) => a.category === 'mouth' && a.name.toLowerCase().includes('smile2'))
    const mouth3 = assetStore.assets.find((a) => a.category === 'mouth' && a.name.toLowerCase().includes('smile3'))
    const eyes = assetStore.assets.find((a) => a.category === 'eyes')
    const armLeft =
      assetStore.assets.find((a) => a.category === 'arms_left' && a.name.toLowerCase().includes('default')) ||
      assetStore.assets.find((a) => a.category === 'arms_left')
    const armRight =
      assetStore.assets.find((a) => a.category === 'arms_right' && a.name.toLowerCase().includes('open')) ||
      assetStore.assets.find((a) => a.category === 'arms_right')
    const desk = assetStore.assets.find((a) => a.category === 'desk')
    const light = assetStore.assets.find(
      (a) => a.category === 'props_set' && a.name.toLowerCase().includes('light')
    )

    // Réinitialiser les pistes
    for (const track of timelineStore.currentSequence.tracks) {
      if (track.category === 'arms_left' && track.zIndex < 10) {
        track.zIndex = 12
      }
      track.keyframes = []
    }

    const firstStep = timelineStore.orderedSteps[0]
    if (!firstStep) return
    const secondStep = timelineStore.addStepAfter(firstStep.id)
    const thirdStep = timelineStore.addStepAfter(secondStep.id)
    const fourthStep = timelineStore.addStepAfter(thirdStep.id)
    addInitialKeyframe('background', background, firstStep.id)
    addInitialKeyframe('torso', torso, firstStep.id)
    addInitialKeyframe('head', head, firstStep.id)
    addInitialKeyframe('mouth', mouth1, firstStep.id)
    addInitialKeyframe('mouth', mouth2, secondStep.id)
    addInitialKeyframe('mouth', mouth3, thirdStep.id)
    addInitialKeyframe('mouth', mouth1, fourthStep.id)
    addInitialKeyframe('eyes', eyes, firstStep.id)
    addInitialKeyframe('arms_left', armLeft, firstStep.id)
    addInitialKeyframe('arms_right', armRight, firstStep.id)
    addInitialKeyframe('desk', desk, firstStep.id)
    addInitialKeyframe('props_set', light, firstStep.id)
    timelineStore.selectStep(firstStep.id)
    timelineStore.clearStudioSelection(false)
    await timelineStore.saveSequence()
  }

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
        <AssetLibraryPanel />
      </ResizableSidebar>

      <!-- Viewport & Canvas de Composition (Centre) -->
      <StudioViewport
        v-model:show-hierarchy="showHierarchy"
        v-model:show-assets="showAssetLibrary"
      />

      <!-- Inspecteur de Hiérarchie des Calques (Droite) -->
      <ResizableSidebar
        v-model:open="showHierarchy"
        side="right"
        :default-width="320"
        :min-width="260"
        :max-width="520"
        storage-key="berlu.hierarchy-sidebar-width"
      >
        <HierarchyInspector />
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
