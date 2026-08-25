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

const emit = defineEmits<{
  (e: 'openAiDirector'): void
}>()

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
  <div class="h-11 border-b border-border/40 px-4 flex items-center justify-between bg-surface/60 backdrop-blur-md z-10 select-none">
    <!-- Timecode & Cadence -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-border/40 font-mono text-sm">
        <span class="text-primary font-bold">{{ formattedCurrentTime }}</span>
        <span class="text-muted-foreground text-xs">/ {{ formattedTotalTime }}</span>
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
    <div class="flex items-center gap-1.5">
      <IconButton
        icon="first_page"
        size="sm"
        variant="ghost"
        title="Retour au début (Stop)"
        @click="timelineStore.stop"
      />
      <IconButton
        icon="chevron_left"
        size="sm"
        variant="ghost"
        title="Image précédente (-1 frame)"
        @click="stepFrame(-1)"
      />
      <Button
        :variant="timelineStore.playback.isPlaying ? 'secondary' : 'primary'"
        size="sm"
        class="min-w-[72px] font-bold"
        @click="timelineStore.togglePlay"
      >
        <Icon :name="timelineStore.playback.isPlaying ? 'pause' : 'play_arrow'" size="sm" />
        {{ timelineStore.playback.isPlaying ? 'Pause' : 'Play' }}
      </Button>
      <IconButton
        icon="chevron_right"
        size="sm"
        variant="ghost"
        title="Image suivante (+1 frame)"
        @click="stepFrame(1)"
      />
      <IconButton
        :icon="timelineStore.playback.loop ? 'repeat' : 'repeat_one'"
        size="sm"
        :variant="timelineStore.playback.loop ? 'primary' : 'ghost'"
        title="Boucler la lecture"
        @click="timelineStore.playback.loop = !timelineStore.playback.loop"
      />
    </div>

    <!-- Zoom & Assistant IA -->
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 w-36">
        <Icon name="zoom_out" size="xs" class="text-muted-foreground" />
        <Slider
          v-model="timelineStore.playback.zoom"
          :min="50"
          :max="300"
          :step="10"
          size="sm"
        />
        <Icon name="zoom_in" size="xs" class="text-muted-foreground" />
      </div>

      <Button
        variant="outline"
        size="sm"
        class="border-primary/50 text-primary hover:bg-primary/10 gap-1.5 font-medium"
        @click="emit('openAiDirector')"
      >
        <Icon name="auto_awesome" size="sm" class="text-amber-400 animate-pulse" />
        <span>Scénariste IA</span>
      </Button>
    </div>
  </div>
</template>
