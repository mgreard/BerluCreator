<script setup lang="ts">
import { ref } from 'vue'
import Chip from './Chip.vue'
import type { ChipProps, ChipVariant, ChipSize } from './types'

const variants: ChipVariant[] = ['default', 'selectable', 'removable']
const sizes: ChipSize[] = ['sm', 'md']

const isVueActive = ref(true)
const isTsActive = ref(false)

const state = ref<ChipProps>({
  variant: 'selectable',
  active: false,
  size: 'md',
  disabled: false
})
</script>

<template>
  <Story title="Data Display/Chip" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Filter Selection">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Chip variant="selectable" :active="isVueActive" @click="isVueActive = !isVueActive">
          Vue.js
        </Chip>
        <Chip variant="selectable" :active="isTsActive" @click="isTsActive = !isTsActive">
          TypeScript
        </Chip>
        <Chip variant="selectable" :active="false"> Tailwind CSS </Chip>
      </div>
    </Variant>

    <Variant title="Removable Tags">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Chip variant="removable" @remove="() => {}">UI Library</Chip>
        <Chip variant="removable" @remove="() => {}">Glassmorphism</Chip>
        <Chip variant="removable" size="sm" @remove="() => {}">OKLCH</Chip>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Chip v-bind="state" @click="state.active = !state.active"> Chip Interactif </Chip>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstCheckbox v-model="state.active" title="Active" />
        <HstCheckbox v-model="state.disabled" title="Disabled" />
      </template>
    </Variant>
  </Story>
</template>
