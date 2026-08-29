<script setup lang="ts">
import { ref } from 'vue'
import RigCalibrationViewport from './RigCalibrationViewport.vue'
import type { RigViewportPartItem, RigViewportPoint } from './types'

const origin = ref<RigViewportPoint>({ x: 212, y: 419 })
const parts = ref<RigViewportPartItem[]>([
  {
    id: 'head-1',
    category: 'head',
    label: 'Tête surprise',
    width: 260,
    height: 309,
    x: 0,
    y: -260,
    scale: 1,
    rotation: -14,
    zIndex: 20,
    color: '#fb7185'
  },
  {
    id: 'eyes-1',
    category: 'eyes',
    label: 'Yeux rieurs',
    width: 120,
    height: 60,
    x: 0,
    y: -240,
    scale: 1,
    rotation: -14,
    zIndex: 26,
    color: '#22d3ee'
  }
])
const selectedPartId = ref<string | null>('head-1')
</script>

<template>
  <Story title="RigCalibrationViewport">
    <Variant title="Défaut Multi-Pièces">
      <div class="h-[600px] w-full border border-border-default">
        <RigCalibrationViewport
          :body-width="424"
          :body-height="838"
          :body-origin="origin"
          :parts="parts"
          :selected-part-id="selectedPartId"
          @update:body-origin="origin = $event"
          @update:selected-target="selectedPartId = $event"
        />
      </div>
    </Variant>
  </Story>
</template>
