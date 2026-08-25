<script setup lang="ts">
import { ref } from 'vue'
import SubtypeBadge from './SubtypeBadge.vue'
import type { SubtypeBadgeProps, SubtypeBadgeSize, SubtypeBadgeVariant } from './types'

const sizes: SubtypeBadgeSize[] = ['mini', 'sm', 'md']
const variants: SubtypeBadgeVariant[] = ['neutral', 'subtle', 'outline']

const state = ref<SubtypeBadgeProps>({
  subType: 'Elfe Sylvain',
  size: 'sm',
  variant: 'neutral',
  ellipsis: false
})
</script>

<template>
  <Story title="Data Display/SubtypeBadge" :layout="{ type: 'grid', width: '360px' }">
    <Variant title="Variants">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <SubtypeBadge sub-type="Humain" variant="neutral" />
        <SubtypeBadge sub-type="Elfe" variant="subtle" />
        <SubtypeBadge sub-type="Nain" variant="outline" />
      </div>
    </Variant>

    <Variant title="Sizes">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <SubtypeBadge sub-type="Guerrier" size="mini" />
        <SubtypeBadge sub-type="Magicien" size="sm" />
        <SubtypeBadge sub-type="Paladin" size="md" />
      </div>
    </Variant>

    <Variant title="Ellipsis Truncation">
      <div
        class="flex flex-col gap-3 p-6 bg-bg-surface border border-border-default rounded-xl max-w-xs"
      >
        <SubtypeBadge
          sub-type="Sous-type excessivement long avec troncature automatique"
          :ellipsis="140"
        />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <SubtypeBadge v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.subType" title="Subtype" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstCheckbox v-model="state.ellipsis" title="Ellipsis" />
      </template>
    </Variant>
  </Story>
</template>
