<script setup lang="ts">
import { useTimelineStore } from '../stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'

const timelineStore = useTimelineStore()
</script>

<template>
  <div class="w-64 border-r border-border/40 bg-surface/50 backdrop-blur-md flex flex-col shrink-0 select-none">
    <!-- En-tête fixe aligné avec la règle temporelle -->
    <div class="h-7 border-b border-border/40 px-3 flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
      <span>Piste / Calque</span>
      <span>Z-Index</span>
    </div>

    <!-- Liste des en-têtes de pistes -->
    <div class="flex-1 overflow-hidden">
      <div
        v-for="track in timelineStore.currentSequence.tracks"
        :key="track.id"
        class="h-8 border-b border-border/30 px-2 flex items-center justify-between gap-1 text-xs transition-colors cursor-pointer"
        :class="[
          timelineStore.selectedTrackId === track.id
            ? 'bg-primary/15 border-primary/40 font-semibold text-foreground'
            : 'hover:bg-surface-hover/50 text-foreground/80'
        ]"
        @click="timelineStore.selectedTrackId = track.id"
      >
        <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
          <Icon
            :name="ASSET_CATEGORIES[track.targetSlot]?.icon || 'layers'"
            size="xs"
            class="text-primary shrink-0"
          />
          <span class="truncate">{{ track.name }}</span>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <Badge variant="neutral" size="sm" class="text-[10px] font-mono px-1 py-0">
            {{ track.keyframes.length }}
          </Badge>
          <IconButton
            :icon="track.muted ? 'visibility_off' : 'visibility'"
            size="xs"
            :variant="track.muted ? 'destructive' : 'ghost'"
            :title="track.muted ? 'Activer la piste' : 'Désactiver la piste'"
            @click.stop="timelineStore.toggleTrackMute(track.id)"
          />
          <IconButton
            :icon="track.locked ? 'lock' : 'lock_open'"
            size="xs"
            :variant="track.locked ? 'secondary' : 'ghost'"
            :title="track.locked ? 'Déverrouiller' : 'Verrouiller'"
            @click.stop="timelineStore.toggleTrackLock(track.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
