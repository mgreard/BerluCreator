<script setup lang="ts">
import { computed } from 'vue'
import { useTimelineStore } from '../../stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import type { TimelineTrack } from '@core/types/timeline.types'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/shared/utils/cn'
import type { SequenceGridEmits } from './types'

const emit = defineEmits<SequenceGridEmits>()
const timelineStore = useTimelineStore()

const groups = computed(() => (timelineStore.currentSequence.groups ?? []).filter(
  (group) => !group.isDefault || timelineStore.currentSequence.tracks.some(
    (track) => track.groupId === group.id && track.keyframes.some((keyframe) => keyframe.sprites.length > 0)
  )
))
const ungroupedTracks = computed(() => {
  const groupIds = new Set(groups.value.map((group) => group.id))
  return timelineStore.currentSequence.tracks.filter(
    (track) => !track.groupId || !groupIds.has(track.groupId)
  )
})

function tracksForGroup(groupId: string) {
  return timelineStore.currentSequence.tracks.filter((track) => track.groupId === groupId)
}

function explicitKeyframe(track: TimelineTrack, stepId: string) {
  return track.keyframes.find((keyframe) => keyframe.stepId === stepId) ?? null
}

function selectCell(track: TimelineTrack, stepId: string) {
  timelineStore.selectStep(stepId)
  const keyframe = explicitKeyframe(track, stepId)
  if (keyframe) timelineStore.selectKeyframeForEditing(track.id, keyframe.id)
  else timelineStore.selectTrackForEditing(track.id)
}

function cellLabel(track: TimelineTrack, stepId: string) {
  const explicit = explicitKeyframe(track, stepId)
  if (explicit) return `${track.name} : snapshot autonome, ${explicit.sprites.length} sprite(s)`
  return `${track.name} : aucun sprite`
}
</script>

<template>
  <div
    role="grid"
    aria-label="Séquence de keyframes par étapes"
    class="relative inline-block min-w-full"
    @scroll="emit('scroll', $event)"
  >
    <div role="row" class="sticky top-0 z-20 flex h-10 min-w-max border-b border-border-subtle bg-bg-elevated/95 backdrop-blur-md">
      <Button
        v-for="(step, index) in timelineStore.orderedSteps"
        :key="step.id"
        role="columnheader"
        variant="ghost"
        size="xs"
        class="flex w-28 shrink-0 items-center justify-center gap-1.5 border-r border-border-subtle text-[11px] font-bold transition-colors"
        :class="step.id === timelineStore.activeStep?.id ? 'bg-primary/20 text-primary ring-1 ring-inset ring-primary/50' : 'text-text-secondary hover:bg-bg-surface-hover'"
        :aria-selected="step.id === timelineStore.activeStep?.id"
        @click="timelineStore.selectStep(step.id)"
      >
        <span class="font-mono text-[9px] text-text-muted">{{ String(index + 1).padStart(2, '0') }}</span>
        {{ step.label }}
      </Button>
    </div>

    <template v-for="group in groups" :key="group.id">
      <div
        role="row"
        class="flex h-8 min-w-max border-b border-border-subtle/70 transition-colors"
        :class="timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group' ? 'bg-primary/10' : 'bg-bg-surface/35'"
      >
        <div
          v-for="step in timelineStore.orderedSteps"
          :key="step.id"
          role="gridcell"
          class="w-28 shrink-0 border-r border-border-subtle/40"
          :class="step.id === timelineStore.activeStep?.id ? 'bg-primary/5' : ''"
        />
      </div>

      <template v-if="!group.collapsed">
        <div
          v-for="track in tracksForGroup(group.id)"
          :key="track.id"
          role="row"
          class="flex h-8 min-w-max border-b border-border-subtle/40"
        >
          <Button
            v-for="step in timelineStore.orderedSteps"
            :key="step.id"
            role="gridcell"
            variant="ghost"
            size="xs"
            :aria-label="cellLabel(track, step.id)"
            :aria-selected="step.id === timelineStore.activeStep?.id && track.id === timelineStore.selectedTrackId"
            :class="cn(
              'group/cell relative flex w-28 shrink-0 items-center justify-center border-r border-border-subtle/40 transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
              step.id === timelineStore.activeStep?.id ? 'bg-primary/6' : 'hover:bg-bg-surface-hover/50'
            )"
            @click="selectCell(track, step.id)"
          >
            <span
              v-if="explicitKeyframe(track, step.id)"
              class="flex min-w-9 items-center justify-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-bold shadow-xs"
              :style="{
                color: ASSET_CATEGORIES[track.category].color,
                borderColor: `color-mix(in srgb, ${ASSET_CATEGORIES[track.category].color} 55%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${ASSET_CATEGORIES[track.category].color} 18%, var(--color-bg-surface))`
              }"
            >
              <Icon :name="ASSET_CATEGORIES[track.category].icon" size="11px" />
              {{ explicitKeyframe(track, step.id)?.sprites.length ?? 0 }}
            </span>
            <span v-else class="size-1 rounded-full bg-border-default/70" />
          </Button>
        </div>
      </template>
    </template>

    <div v-for="track in ungroupedTracks" :key="track.id" role="row" class="flex h-8 min-w-max border-b border-border-subtle/40">
      <Button
        v-for="step in timelineStore.orderedSteps"
        :key="step.id"
        role="gridcell"
        variant="ghost"
        size="xs"
        class="flex w-28 shrink-0 items-center justify-center border-r border-border-subtle/40 hover:bg-bg-surface-hover/50"
        :aria-label="cellLabel(track, step.id)"
        @click="selectCell(track, step.id)"
      >
        <span v-if="explicitKeyframe(track, step.id)" class="size-3 rotate-45 rounded-xs bg-primary" />
        <span v-else class="size-1 rounded-full bg-border-default/70" />
      </Button>
    </div>
  </div>
</template>
