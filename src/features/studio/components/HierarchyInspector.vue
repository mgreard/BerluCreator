<script setup lang="ts">
import { useHierarchyResolver } from '../composables/useHierarchyResolver'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'

const { activeLayers } = useHierarchyResolver()
const timelineStore = useTimelineStore()
</script>

<template>
  <div class="w-80 h-full border-l border-border/40 bg-surface/30 backdrop-blur-md flex flex-col">
    <div class="h-10 border-b border-border/40 px-4 flex items-center justify-between">
      <div class="flex items-center gap-2 font-medium text-xs text-foreground/80">
        <Icon name="account_tree" size="sm" class="text-primary" />
        <span>Arbre des Calques Actifs</span>
      </div>
      <Badge variant="neutral" size="sm">
        {{ activeLayers.length }} calques
      </Badge>
    </div>

    <div class="flex-1 overflow-y-auto p-3 space-y-2">
      <div
        v-for="layer in activeLayers"
        :key="layer.trackId"
        class="p-2.5 rounded-lg border border-border/50 bg-surface/50 hover:bg-surface-hover/80 transition-colors flex flex-col gap-1.5 text-xs"
      >
        <div class="flex items-center justify-between">
          <span class="font-semibold text-foreground truncate flex items-center gap-1.5">
            <Icon name="layers" size="xs" class="text-primary" />
            {{ layer.asset.name }}
          </span>
          <Badge variant="neutral" size="sm" class="text-[10px]">
            {{ layer.category }}
          </Badge>
        </div>

        <div class="flex items-center justify-between text-muted-foreground text-[11px] font-mono">
          <span>X: {{ Math.round(layer.x) }}px</span>
          <span>Y: {{ Math.round(layer.y) }}px</span>
          <span>Z: {{ layer.zIndex }}</span>
          <IconButton
            icon="visibility"
            size="xs"
            variant="ghost"
            title="Masquer le calque"
            @click="timelineStore.toggleTrackMute(layer.trackId)"
          />
        </div>
      </div>

      <div
        v-if="activeLayers.length === 0"
        class="flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-2"
      >
        <Icon name="hourglass_empty" size="lg" class="opacity-40" />
        <p class="text-xs">Aucun calque actif à cet instant.</p>
        <p class="text-[11px] opacity-70">Ajoutez des keyframes sur la timeline pour afficher les sprites.</p>
      </div>
    </div>
  </div>
</template>
