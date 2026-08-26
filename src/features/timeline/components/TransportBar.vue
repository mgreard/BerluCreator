<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import { formatTimecode } from '@/lib/utils'
import { SUPPORTED_FRAME_RATES } from '@core/constants/timeline'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Icon } from '@/components/ui/icon'

const timelineStore = useTimelineStore()

const formattedCurrentTime = computed(() => {
  return formatTimecode(timelineStore.playback.currentTimeMs)
})

const formattedTotalTime = computed(() => {
  return formatTimecode(timelineStore.currentSequence.durationMs)
})

const fpsOptions = SUPPORTED_FRAME_RATES.map((fps) => ({
  value: fps,
  label: `${fps} FPS`
}))

function stepFrame(frames: number) {
  const frameDurationMs = 1000 / timelineStore.currentSequence.fps
  timelineStore.seek(timelineStore.playback.currentTimeMs + frames * frameDurationMs)
}
</script>

<template>
  <div class="h-11 border-b border-border-subtle px-4 flex items-center justify-between bg-bg-surface/70 backdrop-blur-md z-10 select-none">
    <!-- Timecode & Cadence -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-bg-base border border-border-subtle font-mono text-xs shadow-xs">
        <span class="text-primary font-bold tracking-wider">{{ formattedCurrentTime }}</span>
        <span class="text-text-muted text-[11px]">/ {{ formattedTotalTime }}</span>
      </div>

      <div class="w-28">
        <Select
          :model-value="timelineStore.currentSequence.fps"
          :options="fpsOptions"
          size="sm"
          @update:model-value="timelineStore.setFps(Number($event))"
        />
      </div>
    </div>

    <!-- Contrôles de lecture centraux -->
    <div class="flex items-center gap-1">
      <IconButton
        icon="first_page"
        size="xs"
        variant="ghost"
        title="Retour au début (Stop)"
        class="text-text-muted hover:text-text-primary"
        @click="timelineStore.stop"
      />
      <IconButton
        icon="chevron_left"
        size="xs"
        variant="ghost"
        title="Image précédente (-1 frame)"
        class="text-text-muted hover:text-text-primary"
        @click="stepFrame(-1)"
      />
      <Button
        :variant="timelineStore.playback.isPlaying ? 'secondary' : 'primary'"
        size="sm"
        class="h-7 min-w-[70px] font-bold gap-1 shadow-glass-sm"
        @click="timelineStore.togglePlay"
      >
        <Icon :name="timelineStore.playback.isPlaying ? 'pause' : 'play_arrow'" size="xs" />
        <span>{{ timelineStore.playback.isPlaying ? 'Pause' : 'Play' }}</span>
      </Button>
      <IconButton
        icon="chevron_right"
        size="xs"
        variant="ghost"
        title="Image suivante (+1 frame)"
        class="text-text-muted hover:text-text-primary"
        @click="stepFrame(1)"
      />
      <IconButton
        :icon="timelineStore.playback.loop ? 'repeat' : 'repeat_one'"
        size="xs"
        variant="ghost"
        :active="timelineStore.playback.loop"
        title="Boucler la lecture"
        class="text-text-muted hover:text-text-primary"
        @click="timelineStore.playback.loop = !timelineStore.playback.loop"
      />
    </div>

    <!-- Zoom de la timeline -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-1.5 w-36">
        <IconButton
          icon="zoom_out"
          size="xs"
          variant="ghost"
          class="text-text-muted hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center p-0.5 rounded touch-manipulation"
          title="Dézoomer (-25px/s)"
          @click="timelineStore.playback.zoom = Math.max(50, timelineStore.playback.zoom - 25)"
        />
        <Slider
          v-model="timelineStore.playback.zoom"
          :min="50"
          :max="300"
          :step="10"
          size="sm"
          tooltip="hover"
          :formatter="(val) => `${val}px/s`"
          class="flex-1"
        />
        <IconButton
          icon="zoom_in"
          size="xs"
          variant="ghost"
          class="text-text-muted hover:text-text-primary transition-colors cursor-pointer flex items-center justify-center p-0.5 rounded touch-manipulation"
          title="Zoomer (+25px/s)"
          @click="timelineStore.playback.zoom = Math.min(300, timelineStore.playback.zoom + 25)"
        />
      </div>

    </div>
  </div>
</template>
