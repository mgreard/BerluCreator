<script setup lang="ts">
import { ref } from 'vue'
import Kbd from './Kbd.vue'
import type { KbdProps, KbdSize, KbdVariant } from './types'

const sizes: KbdSize[] = ['xs', 'sm', 'md', 'lg']
const variants: KbdVariant[] = ['default', 'outline', 'subtle', 'glass']

const state = ref<KbdProps>({
  keys: ['⌘', 'Shift', 'P'],
  size: 'sm',
  variant: 'default'
})
</script>

<template>
  <Story title="Data Display/Kbd" :layout="{ type: 'grid', width: '360px' }">
    <Variant title="Single & Multiple Keys">
      <div
        class="flex flex-wrap items-center gap-4 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Kbd keys="⌘K" />
        <Kbd :keys="['Ctrl', 'C']" />
        <Kbd :keys="['⌘', 'Shift', 'P']" />
      </div>
    </Variant>

    <Variant title="Sizes Scale">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Kbd keys="ESC" size="xs" />
        <Kbd keys="ESC" size="sm" />
        <Kbd keys="ESC" size="md" />
        <Kbd keys="ESC" size="lg" />
      </div>
    </Variant>

    <Variant title="Variants">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Kbd keys="⌘A" variant="default" />
        <Kbd keys="⌘A" variant="outline" />
        <Kbd keys="⌘A" variant="subtle" />
        <Kbd keys="⌘A" variant="glass" />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Kbd v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
      </template>
    </Variant>
  </Story>
</template>
