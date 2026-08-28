<script setup lang="ts">
import { ref } from 'vue'
import RigCalibrationPanel from './RigCalibrationPanel.vue'
import type { RigCalibrationPanelValue } from './types'

const selected = ref('head-1')
const value = ref<RigCalibrationPanelValue>({ x: -12, y: 24, scale: 0.82, rotation: 0, zIndex: 10 })
</script>

<template>
  <Story title="RigCalibrationPanel">
    <Variant title="Panneau actif (v3)">
      <div class="relative h-[720px] bg-bg-base p-4">
        <RigCalibrationPanel
          character-name="Berlu"
          canvas-label="840 × 908"
          :rigs="[
            { id: 'rig-body', label: 'Corps complet', bodyLabel: '1031 × 812 px', isDefault: true },
            { id: 'rig-bust', label: 'Buste tropical', bodyLabel: '424 × 838 px', isDefault: false }
          ]"
          selected-rig-id="rig-body"
          :categories="[
            { value: 'head', label: 'Têtes & Visages', enabled: true },
            { value: 'arms_left', label: 'Bras gauche', enabled: false }
          ]"
          selected-category="head"
          :category-enabled="true"
          :items="[
            {
              id: 'head-1',
              label: 'Tête surprise',
              categoryLabel: 'Têtes & Visages',
              dimensions: '260 × 309 px',
              compatible: true,
              isDefault: true,
              hasOverride: false
            },
            {
              id: 'head-2',
              label: 'Tête lunettes',
              categoryLabel: 'Têtes & Visages',
              dimensions: '280 × 320 px',
              compatible: true,
              isDefault: false,
              hasOverride: true
            }
          ]"
          selected-item-id="head-1"
          heritage-state="template"
          :value="value"
          :can-duplicate="true"
          @select="selected = $event"
          @update:value="value = $event"
        />
      </div>
    </Variant>
  </Story>
</template>
