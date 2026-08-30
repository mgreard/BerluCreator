<script setup lang="ts">
import StageCanvas from './StageCanvas.vue'
import RigCalibrationViewportWorkspace from './RigCalibrationViewportWorkspace.vue'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import type { TourKey } from '@/features/project/services/tour-definitions'

const { isSavedSnapshotsOpen = false } = defineProps<{
  isSavedSnapshotsOpen?: boolean
}>()

const emit = defineEmits<{
  (event: 'openExport'): void
  (event: 'toggleSavedSnapshots'): void
  (event: 'startTour', key?: TourKey): void
}>()

const rigCatalog = useRigCatalogStore()
</script>

<template>
  <div class="relative flex-1 h-full bg-bg-base overflow-hidden">
    <div
      id="studio-overlay-host"
      class="pointer-events-none absolute inset-0 z-[60] overflow-hidden"
    />
    <div class="absolute inset-0 overflow-hidden bg-dot-pattern">
      <RigCalibrationViewportWorkspace v-if="rigCatalog.isCalibrationOpen" />
      <StageCanvas
        v-else
        :is-saved-snapshots-open="isSavedSnapshotsOpen"
        @open-export="emit('openExport')"
        @toggle-saved-snapshots="emit('toggleSavedSnapshots')"
        @start-tour="(key) => emit('startTour', key)"
      />
    </div>
  </div>
</template>

<style scoped>
.bg-dot-pattern {
  background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.04) 1px, transparent 0);
  background-size: 24px 24px;
}
</style>
