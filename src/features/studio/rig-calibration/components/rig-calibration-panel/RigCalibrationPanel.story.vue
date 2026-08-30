<script setup lang="ts">
import { ref } from 'vue'
import RigCalibrationPanel from './RigCalibrationPanel.vue'
import type { RigCalibrationCategoryConfig, RigCalibrationPanelValue } from './types'

const origin = ref({ x: 212, y: 419 })
const isEditingOrigin = ref(false)

const categories = ref<RigCalibrationCategoryConfig[]>([
  {
    category: 'head',
    label: 'Têtes & Visages',
    icon: 'face',
    color: '#fb7185',
    enabled: true,
    items: [
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
    ],
    selectedItemId: 'head-1',
    heritageState: 'template',
    value: { x: -12, y: 24, scale: 0.82, rotation: -14, zIndex: 20 }
  }
])

function onUpdateValue(category: string, next: RigCalibrationPanelValue) {
  const cat = categories.value.find((c) => c.category === category)
  if (cat) cat.value = next
}
</script>

<template>
  <Story title="Studio/RigCalibrationPanel">
    <Variant title="Panneau multi-catégories">
      <div class="relative h-[720px] bg-bg-base p-4">
        <RigCalibrationPanel
          character-name="Berlu"
          canvas-label="840 × 908"
          :rigs="[
            { id: 'rig-body', label: 'Corps complet', bodyLabel: '1031 × 812 px', isDefault: true },
            { id: 'rig-bust', label: 'Buste tropical', bodyLabel: '424 × 838 px', isDefault: false }
          ]"
          selected-rig-id="rig-body"
          :body-origin="origin"
          :is-editing-origin="isEditingOrigin"
          :categories="categories"
          :can-duplicate="true"
          @update:value="onUpdateValue"
          @edit-origin="isEditingOrigin = !isEditingOrigin"
          @reset-origin="origin = { x: 212, y: 419 }"
        />
      </div>
    </Variant>
  </Story>
</template>
