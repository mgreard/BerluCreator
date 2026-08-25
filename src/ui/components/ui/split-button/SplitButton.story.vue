<script setup lang="ts">
import { ref } from 'vue'
import SplitButton from './SplitButton.vue'
import type {
  SplitButtonItem,
  SplitButtonVariant,
  SplitButtonSize,
  SplitButtonShape
} from './types'

const secondaryActions: SplitButtonItem[] = [
  { key: 'draft', label: 'Enregistrer comme brouillon', icon: 'edit' },
  { key: 'schedule', label: 'Programmer la publication', icon: 'schedule' },
  { key: 'export', label: 'Exporter au format PDF', icon: 'download' },
  { key: 'delete', label: 'Supprimer définitivement', icon: 'delete', destructive: true }
]

const variants: SplitButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive']
const sizes: SplitButtonSize[] = ['sm', 'md', 'lg']
const shapes: SplitButtonShape[] = ['pill', 'rounded']

const playgroundState = ref({
  variant: 'primary' as SplitButtonVariant,
  size: 'md' as SplitButtonSize,
  shape: 'rounded' as SplitButtonShape,
  disabled: false,
  loading: false,
  loadingText: ''
})
</script>

<template>
  <Story title="Buttons/SplitButton" :layout="{ type: 'grid', width: '360px' }">
    <Variant v-for="v in variants" :key="v" :title="`Variant: ${v}`">
      <div
        class="flex items-center justify-center p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <SplitButton
          :label="v === 'destructive' ? 'Supprimer' : 'Publier'"
          :variant="v"
          :items="secondaryActions"
        />
      </div>
    </Variant>

    <Variant title="Shapes (Pill vs Rounded)">
      <div class="flex flex-col gap-4 p-6 bg-bg-surface border border-border-default rounded-xl">
        <SplitButton label="Action Pill" shape="pill" :items="secondaryActions" />
        <SplitButton label="Action Rounded" shape="rounded" :items="secondaryActions" />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <SplitButton label="Sauvegarder" :items="secondaryActions" v-bind="playgroundState" />
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="playgroundState.variant" title="Variant" :options="variants" />
        <HstSelect v-model="playgroundState.size" title="Size" :options="sizes" />
        <HstSelect v-model="playgroundState.shape" title="Shape" :options="shapes" />
        <HstCheckbox v-model="playgroundState.disabled" title="Disabled" />
        <HstCheckbox v-model="playgroundState.loading" title="Loading" />
        <HstText v-model="playgroundState.loadingText" title="Loading Text" />
      </template>
    </Variant>
  </Story>
</template>
