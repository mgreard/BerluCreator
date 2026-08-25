<script setup lang="ts">
import { ref } from 'vue'
import Separator from './Separator.vue'
import type {
  SeparatorProps,
  SeparatorOrientation,
  SeparatorVariant,
  SeparatorLabelAlign
} from './types'

const orientations: SeparatorOrientation[] = ['horizontal', 'vertical']
const variants: SeparatorVariant[] = ['default', 'subtle', 'gradient', 'dashed']
const labelAligns: SeparatorLabelAlign[] = ['start', 'center', 'end']

const state = ref<SeparatorProps>({
  orientation: 'horizontal',
  variant: 'default',
  label: 'OU',
  labelAlign: 'center',
  decorative: true
})
</script>

<template>
  <Story title="Data Display/Separator" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="With Labels">
      <div
        class="flex flex-col gap-6 p-6 bg-bg-surface border border-border-default rounded-xl w-full"
      >
        <Separator label="OU" />
        <Separator label="Début" label-align="start" />
        <Separator label="Fin" label-align="end" />
      </div>
    </Variant>

    <Variant title="Border Variants">
      <div
        class="flex flex-col gap-6 p-6 bg-bg-surface border border-border-default rounded-xl w-full"
      >
        <Separator variant="default" />
        <Separator variant="subtle" />
        <Separator variant="gradient" />
        <Separator variant="dashed" />
      </div>
    </Variant>

    <Variant title="Vertical Layout">
      <div
        class="flex items-center gap-4 h-12 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <span class="text-sm font-medium">Accueil</span>
        <Separator orientation="vertical" />
        <span class="text-sm font-medium">Composants</span>
        <Separator orientation="vertical" variant="dashed" />
        <span class="text-sm font-medium">Documentation</span>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Separator v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.orientation" title="Orientation" :options="orientations" />
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstText v-model="state.label" title="Label" />
        <HstSelect v-model="state.labelAlign" title="Label Align" :options="labelAligns" />
        <HstCheckbox v-model="state.decorative" title="Decorative" />
      </template>
    </Variant>
  </Story>
</template>
