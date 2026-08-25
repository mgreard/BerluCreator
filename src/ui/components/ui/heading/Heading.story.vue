<script setup lang="ts">
import { ref } from 'vue'
import Heading from './Heading.vue'
import type { HeadingProps, HeadingVariant, HeadingColor } from './types'

const variants: HeadingVariant[] = ['hero', 'page', 'section', 'card', 'sm']
const colors: HeadingColor[] = ['primary', 'secondary', 'muted', 'inverse', 'gradient', 'inherit']

const state = ref<HeadingProps>({
  variant: 'section',
  color: 'primary',
  truncate: false
})
</script>

<template>
  <Story title="Primitives/Heading" :layout="{ type: 'grid', width: '320px' }">
    <Variant v-for="v in variants" :key="v" :title="`Variant: ${v}`">
      <div class="p-4 bg-bg-surface border border-border-default rounded-xl">
        <Heading :variant="v">{{ `Heading ${v.toUpperCase()}` }}</Heading>
      </div>
    </Variant>

    <Variant v-for="c in colors" :key="c" :title="`Color: ${c}`">
      <div class="p-4 bg-bg-surface border border-border-default rounded-xl">
        <Heading variant="section" :color="c">{{ `Heading ${c}` }}</Heading>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
          <Heading v-bind="state"> The quick brown fox jumps over the lazy dog </Heading>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.color" title="Color" :options="colors" />
        <HstCheckbox v-model="state.truncate" title="Truncate" />
      </template>
    </Variant>
  </Story>
</template>
