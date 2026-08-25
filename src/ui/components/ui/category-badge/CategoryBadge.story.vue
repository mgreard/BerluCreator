<script setup lang="ts">
import { ref } from 'vue'
import CategoryBadge from './CategoryBadge.vue'
import type {
  CategoryBadgeProps,
  CategoryBadgeSize,
  CategoryBadgeVariant,
  CategoryBadgeIconType
} from './types'

const sizes: CategoryBadgeSize[] = ['mini', 'sm', 'md']
const variants: CategoryBadgeVariant[] = ['subtle', 'solid', 'outline']
const iconTypes: CategoryBadgeIconType[] = ['symbol', 'emoji', 'none']

const state = ref<CategoryBadgeProps>({
  category: 'design',
  label: 'Design System',
  iconName: 'palette',
  iconType: 'symbol',
  size: 'sm',
  variant: 'subtle',
  interactive: true
})
</script>

<template>
  <Story title="Data Display/CategoryBadge" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Variants & Theming">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <CategoryBadge label="Développement" icon-name="code" variant="subtle" />
        <CategoryBadge label="Sécurité" icon-name="lock" variant="solid" color="#ef4444" />
        <CategoryBadge label="Infrastructure" icon-name="cloud" variant="outline" color="#06b6d4" />
      </div>
    </Variant>

    <Variant title="Emoji & Mini Size">
      <div
        class="flex flex-wrap items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <CategoryBadge label="Énergie" icon="⚡" icon-type="emoji" size="mini" />
        <CategoryBadge label="Nature" icon="🌱" icon-type="emoji" size="sm" />
        <CategoryBadge label="Performance" icon="🚀" icon-type="emoji" size="md" />
      </div>
    </Variant>

    <Variant title="Ellipsis / Truncation">
      <div
        class="flex flex-col gap-3 p-6 bg-bg-surface border border-border-default rounded-xl max-w-xs"
      >
        <CategoryBadge
          label="Catégorie extrêmement longue avec troncature automatique"
          icon-name="folder"
          :ellipsis="160"
        />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <CategoryBadge v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.label" title="Label" />
        <HstText v-model="state.iconName" title="Icon Name" />
        <HstSelect v-model="state.iconType" title="Icon Type" :options="iconTypes" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstCheckbox v-model="state.interactive" title="Interactive" />
      </template>
    </Variant>
  </Story>
</template>
