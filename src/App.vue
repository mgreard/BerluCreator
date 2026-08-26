<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { seedDemoAssetsIfEmpty } from '@/features/asset-manager/services/demo-asset-seeder'
import type { Asset, AssetCategory } from '@core/types/asset.types'

import StudioHeader from '@/features/project/components/StudioHeader.vue'
import AssetLibraryPanel from '@/features/asset-manager/components/AssetLibraryPanel.vue'
import StudioViewport from '@/features/studio/components/StudioViewport.vue'
import HierarchyInspector from '@/features/studio/components/HierarchyInspector.vue'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import ProjectSettingsModal from '@/features/project/components/ProjectSettingsModal.vue'
import ExportSequenceModal from '@/features/project/components/ExportSequenceModal.vue'
import AIDirectorModal from '@/features/ai-director/components/AIDirectorModal.vue'
import ResizableSidebar from '@/features/studio/components/ResizableSidebar.vue'
import ToastContainer from '@/components/ui/toast-container/ToastContainer.vue'

const projectStore = useProjectStore()
const assetStore = useAssetStore()
const timelineStore = useTimelineStore()

const isSettingsOpen = ref(false)
const isExportOpen = ref(false)
const isAiDirectorOpen = ref(false)
const showHierarchy = ref(true)
const showAssetLibrary = ref(true)

function addInitialKeyframe(
  category: AssetCategory,
  asset: Asset | undefined,
  timeMs = 0
) {
  if (!asset) return
  const track = timelineStore.currentSequence.tracks.find(
    (candidate) => candidate.targetSlot === category || candidate.category === category
  )
  if (track) timelineStore.addKeyframe(track.id, timeMs, asset.id, asset.name)
}

onMounted(async () => {
  // 1. Initialiser le projet
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

    addInitialKeyframe('background', background)
    addInitialKeyframe('torso', torso)
    addInitialKeyframe('head', head)
    addInitialKeyframe('mouth', mouth1)
    addInitialKeyframe('mouth', mouth2, 800)
    addInitialKeyframe('mouth', mouth3, 1600)
    addInitialKeyframe('mouth', mouth1, 2400)
    addInitialKeyframe('eyes', eyes)
    addInitialKeyframe('arms_left', armLeft)
    addInitialKeyframe('arms_right', armRight)
    addInitialKeyframe('desk', desk)
    addInitialKeyframe('props_set', light)
    timelineStore.clearStudioSelection(false)
  }
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-bg-base text-text-primary overflow-hidden font-sans select-none">
    <!-- Barre supérieure de navigation -->
    <StudioHeader
      @open-settings="isSettingsOpen = true"
      @open-export="isExportOpen = true"
      @open-ai-director="isAiDirectorOpen = true"
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
    <TimelinePanel @open-ai-director="isAiDirectorOpen = true" />

    <!-- Modales Globales -->
    <ProjectSettingsModal v-model:open="isSettingsOpen" />
    <ExportSequenceModal v-model:open="isExportOpen" />
    <AIDirectorModal v-model:open="isAiDirectorOpen" />

    <!-- Système de notifications Toasts -->
    <ToastContainer />
  </div>
</template>
