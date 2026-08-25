<script setup lang="ts">
import { computed } from 'vue'
import StageCanvas from './StageCanvas.vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'

const projectStore = useProjectStore()
const stage = computed(() => projectStore.currentProject.stage)

function toggleGrid() {
  projectStore.updateStage({ showGrid: !stage.value.showGrid })
}

function toggleSafeArea() {
  projectStore.updateStage({ safeArea: !stage.value.safeArea })
}

function toggleAnchors() {
  projectStore.updateStage({ showAnchors: !stage.value.showAnchors })
}
</script>

<template>
  <div class="relative flex-1 h-full flex flex-col bg-background/50 overflow-hidden">
    <!-- Barre d'outils du Viewport -->
    <div class="h-10 border-b border-border/40 px-4 flex items-center justify-between bg-surface/40 backdrop-blur-md z-10">
      <div class="flex items-center gap-2">
        <Badge variant="outline" size="sm" class="font-mono text-xs">
          {{ stage.width }} &times; {{ stage.height }}
        </Badge>
        <Badge variant="secondary" size="sm" class="text-xs">
          16:9 HD
        </Badge>
      </div>

      <div class="flex items-center gap-1">
        <IconButton
          :icon="stage.showGrid ? 'grid_on' : 'grid_off'"
          size="sm"
          :variant="stage.showGrid ? 'primary' : 'ghost'"
          title="Afficher/Masquer la grille"
          @click="toggleGrid"
        />
        <IconButton
          :icon="stage.safeArea ? 'crop_free' : 'crop'"
          size="sm"
          :variant="stage.safeArea ? 'primary' : 'ghost'"
          title="Afficher/Masquer la Safe-Area TV"
          @click="toggleSafeArea"
        />
        <IconButton
          :icon="stage.showAnchors ? 'scatter_plot' : 'grain'"
          size="sm"
          :variant="stage.showAnchors ? 'primary' : 'ghost'"
          title="Afficher/Masquer les points d'ancrage"
          @click="toggleAnchors"
        />
      </div>
    </div>

    <!-- Zone de rendu du plateau -->
    <div class="flex-1 relative overflow-hidden bg-dot-pattern">
      <StageCanvas />
    </div>
  </div>
</template>

<style scoped>
.bg-dot-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
  background-size: 24px 24px;
}
</style>
