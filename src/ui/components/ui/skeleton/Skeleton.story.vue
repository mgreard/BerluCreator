<script setup lang="ts">
import { ref } from 'vue'
import Skeleton from './Skeleton.vue'
import type { SkeletonProps, SkeletonVariant, SkeletonAnimation } from './types'

const variants: SkeletonVariant[] = ['text', 'circular', 'rounded', 'rectangular', 'card', 'avatar']
const animations: SkeletonAnimation[] = ['shimmer', 'pulse', 'none']
const state = ref<SkeletonProps>({
  variant: 'text',
  animation: 'shimmer',
  lines: 3,
  width: '',
  height: ''
})
</script>

<template>
  <Story title="Feedback/Skeleton" :layout="{ type: 'grid', width: '340px' }">
    <Variant title="Variants Gallery">
      <div class="flex flex-col gap-4 p-6 bg-bg-surface border border-border-default rounded-xl">
        <div class="flex items-center gap-3">
          <Skeleton variant="avatar" />
          <div class="flex-1 flex flex-col gap-1.5">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" height="12px" />
          </div>
        </div>
        <Skeleton variant="card" height="100px" />
      </div>
    </Variant>

    <Variant title="Multilines Text Placeholder">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <Skeleton variant="text" :lines="4" />
      </div>
    </Variant>

    <Variant title="Animations (Shimmer vs Pulse)">
      <div class="flex flex-col gap-4 p-6 bg-bg-surface border border-border-default rounded-xl">
        <div>
          <span class="text-xs text-text-muted mb-1 block">Shimmer Effect</span>
          <Skeleton variant="text" animation="shimmer" :lines="2" />
        </div>
        <div>
          <span class="text-xs text-text-muted mb-1 block">Pulse Animation</span>
          <Skeleton variant="text" animation="pulse" :lines="2" />
        </div>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <Skeleton v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.animation" title="Animation" :options="animations" />
        <HstNumber v-model="state.lines" title="Lines" />
        <HstText v-model="state.width" title="Width" />
        <HstText v-model="state.height" title="Height" />
      </template>
    </Variant>
  </Story>
</template>
