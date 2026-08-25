<script setup lang="ts">
import { computed } from 'vue'
import StageCanvas from './StageCanvas.vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const showHierarchy = defineModel<boolean>('showHierarchy', { default: true })

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
  <div class="relative flex-1 h-full flex flex-col bg-bg-base overflow-hidden">
    <!-- Barre d'outils du Viewport -->
    <div class="h-10 border-b border-border-subtle px-4 flex items-center justify-between bg-bg-surface/50 backdrop-blur-md z-10 select-none">
      <div class="flex items-center gap-2">
        <Badge variant="neutral" size="sm" class="font-mono text-xs text-text-secondary bg-bg-surface-hover/80 border-border-subtle">
          {{ stage.width }} &times; {{ stage.height }}
        </Badge>
        <Badge variant="neutral" size="sm" class="text-xs text-text-muted bg-transparent border-transparent font-medium">
          16:9 Widescreen
        </Badge>
      </div>

      <div class="flex items-center gap-1.5">
        <IconButton
          :icon="stage.showGrid ? 'grid_on' : 'grid_off'"
          size="xs"
          variant="ghost"
          :active="stage.showGrid"
          title="Afficher/Masquer la grille"
          class="text-text-muted hover:text-text-primary"
          @click="toggleGrid"
        />
        <IconButton
          :icon="stage.safeArea ? 'crop_free' : 'crop'"
          size="xs"
          variant="ghost"
          :active="stage.safeArea"
          title="Afficher/Masquer la Safe-Area TV"
          class="text-text-muted hover:text-text-primary"
          @click="toggleSafeArea"
        />
        <IconButton
          :icon="stage.showAnchors ? 'scatter_plot' : 'grain'"
          size="xs"
          variant="ghost"
          :active="stage.showAnchors"
          title="Afficher/Masquer les points d'ancrage"
          class="text-text-muted hover:text-text-primary"
          @click="toggleAnchors"
        />

        <Separator orientation="vertical" variant="subtle" class="h-4 mx-1" />

        <IconButton
          icon="account_tree"
          size="xs"
          variant="ghost"
          :active="showHierarchy"
          title="Afficher/Masquer l'arbre des calques"
          class="text-text-muted hover:text-text-primary"
          @click="showHierarchy = !showHierarchy"
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
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0);
  background-size: 24px 24px;
}
</style>
