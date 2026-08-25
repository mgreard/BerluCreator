<script setup lang="ts">
import { ref } from 'vue'
import Spinner from './Spinner.vue'
import type { SpinnerProps } from './types'

const sizes = ['16px', '24px', '32px', '48px', '64px']
const colors = ['currentColor', '#6366f1', '#10b981', '#f59e0b', '#ef4444']

const state = ref<SpinnerProps>({
  size: '32px',
  color: '#6366f1',
  ariaLabel: 'Chargement des données...'
})
</script>

<template>
  <Story title="Feedback/Spinner" :layout="{ type: 'grid', width: '260px' }">
    <Variant title="Sizes Scale">
      <div
        class="flex items-center justify-around p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Spinner v-for="s in sizes" :key="s" :size="s" />
      </div>
    </Variant>

    <Variant title="Color Accents">
      <div
        class="flex items-center justify-around p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Spinner v-for="c in colors" :key="c" size="28px" :color="c" />
      </div>
    </Variant>

    <Variant title="Inline with Text">
      <div
        class="flex items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl text-sm font-semibold"
      >
        <Spinner size="18px" color="currentColor" />
        <span>Synchronisation en arrière-plan...</span>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <Spinner v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.color" title="Color" :options="colors" />
        <HstText v-model="state.ariaLabel" title="Aria Label" />
      </template>
    </Variant>
  </Story>
</template>
