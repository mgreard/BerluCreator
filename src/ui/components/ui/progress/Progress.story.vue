<script setup lang="ts">
import { ref } from 'vue'
import Progress from './Progress.vue'
import type {
  ProgressProps,
  ProgressVariant,
  ProgressSize,
  ProgressShape,
  ProgressType
} from './types'

const variants: ProgressVariant[] = [
  'primary',
  'success',
  'warning',
  'danger',
  'accent',
  'gradient'
]
const sizes: ProgressSize[] = ['xs', 'sm', 'md', 'lg']
const shapes: ProgressShape[] = ['pill', 'rounded', 'square']
const types: ProgressType[] = ['linear', 'circular']

const state = ref<ProgressProps>({
  modelValue: 65,
  max: 100,
  variant: 'primary',
  size: 'md',
  shape: 'pill',
  type: 'linear',
  showValue: true,
  label: 'Téléchargement',
  indeterminate: false
})
</script>

<template>
  <Story title="Feedback/Progress" :layout="{ type: 'grid', width: '360px' }">
    <Variant title="Color Variants">
      <div class="flex flex-col gap-4 p-6 bg-bg-surface border border-border-default rounded-xl">
        <Progress
          v-for="v in variants"
          :key="v"
          :model-value="70"
          :variant="v"
          :label="`Variant ${v}`"
          show-value
        />
      </div>
    </Variant>

    <Variant title="Sizes Scale">
      <div class="flex flex-col gap-4 p-6 bg-bg-surface border border-border-default rounded-xl">
        <Progress v-for="s in sizes" :key="s" :model-value="50" :size="s" :label="`Size ${s}`" />
      </div>
    </Variant>

    <Variant title="Circular Gauges">
      <div
        class="flex items-center justify-around p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Progress
          type="circular"
          :model-value="25"
          variant="danger"
          size="sm"
          show-value
          label="Usage"
        />
        <Progress
          type="circular"
          :model-value="60"
          variant="primary"
          size="md"
          show-value
          label="Stockage"
        />
        <Progress
          type="circular"
          :model-value="100"
          variant="success"
          size="lg"
          show-value
          label="Objectif"
        />
      </div>
    </Variant>

    <Variant title="Indeterminate Mode">
      <div class="flex flex-col gap-6 p-6 bg-bg-surface border border-border-default rounded-xl">
        <Progress :indeterminate="true" label="Synchronisation linéaire..." />
        <div class="flex justify-center">
          <Progress type="circular" :indeterminate="true" size="md" label="Chargement circulaire" />
        </div>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Progress v-bind="state" class="w-full max-w-sm" />
        </div>
      </template>
      <template #controls>
        <HstNumber v-model="state.modelValue" title="Value" :min="0" :max="100" />
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.shape" title="Shape" :options="shapes" />
        <HstSelect v-model="state.type" title="Type" :options="types" />
        <HstCheckbox v-model="state.showValue" title="Show Value" />
        <HstCheckbox v-model="state.indeterminate" title="Indeterminate" />
        <HstText v-model="state.label" title="Label" />
      </template>
    </Variant>
  </Story>
</template>
