<script setup lang="ts">
import { ref } from 'vue'
import Badge from './Badge.vue'
import type { BadgeProps, BadgeVariant, BadgeSize } from './types'

const variants: BadgeVariant[] = ['success', 'warning', 'danger', 'info', 'accent', 'neutral']
const sizes: BadgeSize[] = ['sm', 'md']

const state = ref<BadgeProps>({
  variant: 'success',
  size: 'md',
  dot: true
})
</script>

<template>
  <Story title="Data Display/Badge" :layout="{ type: 'grid', width: '360px' }">
    <Variant title="Color Variants">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Badge v-for="v in variants" :key="v" :variant="v">
          {{ v }}
        </Badge>
      </div>
    </Variant>

    <Variant title="With Indicator Dot">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Badge variant="success" :dot="true">En ligne</Badge>
        <Badge variant="danger" :dot="true">Erreur</Badge>
        <Badge variant="warning" :dot="true">Maintenance</Badge>
      </div>
    </Variant>

    <Variant title="Sizes">
      <div
        class="flex items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Badge size="sm" variant="accent">Small (sm)</Badge>
        <Badge size="md" variant="accent">Medium (md)</Badge>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Badge v-bind="state"> Statut Personnalisé </Badge>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstCheckbox v-model="state.dot" title="Dot Indicator" />
      </template>
    </Variant>
  </Story>
</template>
