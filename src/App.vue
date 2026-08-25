<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { seedDemoAssetsIfEmpty } from '@/features/asset-manager/services/demo-asset-seeder'

import StudioHeader from '@/features/project/components/StudioHeader.vue'
import AssetLibraryPanel from '@/features/asset-manager/components/AssetLibraryPanel.vue'
import StudioViewport from '@/features/studio/components/StudioViewport.vue'
import HierarchyInspector from '@/features/studio/components/HierarchyInspector.vue'
import TimelinePanel from '@/features/timeline/components/TimelinePanel.vue'
import ProjectSettingsModal from '@/features/project/components/ProjectSettingsModal.vue'
import ExportSequenceModal from '@/features/project/components/ExportSequenceModal.vue'
import AIDirectorModal from '@/features/ai-director/components/AIDirectorModal.vue'
import ToastContainer from '@/components/ui/toast-container/ToastContainer.vue'

const projectStore = useProjectStore()
const assetStore = useAssetStore()
const timelineStore = useTimelineStore()

const isSettingsOpen = ref(false)
const isExportOpen = ref(false)
const isAiDirectorOpen = ref(false)
const showHierarchy = ref(true)

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
    t.keyframes.some((k) => assetStore.assets.some((a) => a.id === k.assetId))
  )

  if (!hasValidKeyframes && assetStore.assets.length > 0) {
    const backdrop =
      assetStore.assets.find((a) => a.category === 'backdrop' && a.name.toLowerCase().includes('fond')) ||
      assetStore.assets.find((a) => a.category === 'backdrop')
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
      assetStore.assets.find((a) => a.category === 'arms_left' && a.name.toLowerCase().includes('baisse')) ||
      assetStore.assets.find((a) => a.category === 'arms_left')
    const armRight =
      assetStore.assets.find((a) => a.category === 'arms_right' && a.name.toLowerCase().includes('ouvert')) ||
      assetStore.assets.find((a) => a.category === 'arms_right')
    const desk = assetStore.assets.find((a) => a.name.toLowerCase().includes('bureau'))
    const light = assetStore.assets.find((a) => a.category === 'overlay' && a.name.toLowerCase().includes('light'))

    // Réinitialiser les pistes
    for (const track of timelineStore.currentSequence.tracks) {
      if (track.category === 'arms_left' && track.zIndex < 10) {
        track.zIndex = 12
      }
      track.keyframes = []
    }

    if (backdrop) timelineStore.addKeyframe('backdrop', 0, backdrop.id, backdrop.name)
    if (torso) timelineStore.addKeyframe('torso', 0, torso.id, torso.name)
    if (head) timelineStore.addKeyframe('head', 0, head.id, head.name)
    if (mouth1) timelineStore.addKeyframe('mouth', 0, mouth1.id, mouth1.name)
    if (mouth2) timelineStore.addKeyframe('mouth', 800, mouth2.id, mouth2.name)
    if (mouth3) timelineStore.addKeyframe('mouth', 1600, mouth3.id, mouth3.name)
    if (mouth1) timelineStore.addKeyframe('mouth', 2400, mouth1.id, mouth1.name)
    if (eyes) timelineStore.addKeyframe('eyes', 0, eyes.id, eyes.name)
    if (armLeft) timelineStore.addKeyframe('arms_left', 0, armLeft.id, armLeft.name)
    if (armRight) timelineStore.addKeyframe('arms_right', 0, armRight.id, armRight.name)
    if (desk) timelineStore.addKeyframe('props', 0, desk.id, desk.name)
    if (light) timelineStore.addKeyframe('overlay', 0, light.id, light.name)
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
      <AssetLibraryPanel />

      <!-- Viewport & Canvas de Composition (Centre) -->
      <StudioViewport v-model:show-hierarchy="showHierarchy" />

      <!-- Inspecteur de Hiérarchie des Calques (Droite) -->
      <HierarchyInspector v-if="showHierarchy" />
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
