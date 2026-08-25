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

onMounted(async () => {
  // 1. Initialiser le projet
  const proj = await projectStore.loadInitialProject()

  // 2. Pré-remplir les assets de démonstration si premier lancement
  await seedDemoAssetsIfEmpty()
  await assetStore.loadAssets()

  // 3. Charger la séquence active
  await timelineStore.loadSequence(proj.activeSequenceId, proj.id)

  // 4. Si la séquence n'a aucune keyframe, configurer une composition initiale
  const hasKeyframes = timelineStore.currentSequence.tracks.some((t) => t.keyframes.length > 0)
  if (!hasKeyframes && assetStore.assets.length > 0) {
    const backdrop = assetStore.assets.find((a) => a.category === 'backdrop')
    const torso = assetStore.assets.find((a) => a.category === 'torso')
    const head = assetStore.assets.find((a) => a.category === 'head')
    const mouthSmile = assetStore.assets.find((a) => a.category === 'mouth' && a.tags.includes('smile'))
    const mouthTalk = assetStore.assets.find((a) => a.category === 'mouth' && a.tags.includes('talk_a'))
    const eyes = assetStore.assets.find((a) => a.category === 'eyes')
    const arms = assetStore.assets.find((a) => a.category === 'arms_right')
    const overlay = assetStore.assets.find((a) => a.category === 'overlay')

    if (backdrop) timelineStore.addKeyframe('backdrop', 0, backdrop.id, 'Plateau JT')
    if (torso) timelineStore.addKeyframe('torso', 0, torso.id, 'Costume')
    if (head) timelineStore.addKeyframe('head', 0, head.id, 'Visage')
    if (mouthSmile) timelineStore.addKeyframe('mouth', 0, mouthSmile.id, 'Sourire')
    if (mouthTalk) timelineStore.addKeyframe('mouth', 1200, mouthTalk.id, 'Parole')
    if (mouthSmile) timelineStore.addKeyframe('mouth', 2400, mouthSmile.id, 'Sourire')
    if (eyes) timelineStore.addKeyframe('eyes', 0, eyes.id, 'Regard')
    if (arms) timelineStore.addKeyframe('arms_right', 0, arms.id, 'Micro')
    if (overlay) timelineStore.addKeyframe('overlay', 2000, overlay.id, 'Bandeau Flash Info')
  }
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
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
      <StudioViewport />

      <!-- Inspecteur de Hiérarchie des Calques (Droite) -->
      <HierarchyInspector />
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
