<script setup lang="ts">
import { ref } from 'vue'
import SegmentedControl from './SegmentedControl.vue'
import type { SegmentOption, SegmentedControlSize, SegmentedControlVariant } from './types'

const viewOptions: SegmentOption[] = [
  { value: 'day', label: 'Jour', icon: 'calendar_today' },
  { value: 'week', label: 'Semaine', badge: '7j' },
  { value: 'month', label: 'Mois' },
  { value: 'year', label: 'Année', disabled: true }
]

const formatOptions: SegmentOption[] = [
  { value: 'grid', label: 'Grille', icon: 'grid_view' },
  { value: 'list', label: 'Liste', icon: 'view_list' }
]

const selectedView = ref('week')
const selectedFormat = ref('grid')

const sizes: SegmentedControlSize[] = ['sm', 'md', 'lg']
const variants: SegmentedControlVariant[] = ['glass', 'primary']

const playgroundState = ref({
  size: 'md' as SegmentedControlSize,
  variant: 'glass' as SegmentedControlVariant,
  disabled: false
})
</script>

<template>
  <Story title="Buttons/SegmentedControl" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Glass Variant (Default)">
      <div
        class="flex items-center justify-center p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <SegmentedControl v-model="selectedView" :options="viewOptions" variant="glass" />
      </div>
    </Variant>

    <Variant title="Primary Variant">
      <div
        class="flex items-center justify-center p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <SegmentedControl v-model="selectedView" :options="viewOptions" variant="primary" />
      </div>
    </Variant>

    <Variant title="Icon Only / Compact">
      <div
        class="flex items-center justify-center p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <SegmentedControl v-model="selectedFormat" :options="formatOptions" size="sm" />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex flex-col items-center gap-4 p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <SegmentedControl
            v-model="selectedView"
            :options="viewOptions"
            v-bind="playgroundState"
          />
          <span class="text-xs text-text-muted">Valeur active : {{ selectedView }}</span>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="playgroundState.size" title="Size" :options="sizes" />
        <HstSelect v-model="playgroundState.variant" title="Variant" :options="variants" />
        <HstCheckbox v-model="playgroundState.disabled" title="Disabled" />
      </template>
    </Variant>
  </Story>
</template>
