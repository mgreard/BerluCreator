<script setup lang="ts">
import { ref } from 'vue'
import Button from './Button.vue'
import type { ButtonProps, ButtonVariant, ButtonSize, ButtonShape } from './types'

const variants: ButtonVariant[] = ['primary', 'secondary', 'accent', 'ghost', 'destructive']
const sizes: ButtonSize[] = ['sm', 'md', 'lg']
const shapes: ButtonShape[] = ['pill', 'rounded']

const state = ref<ButtonProps>({
  variant: 'primary',
  size: 'md',
  shape: 'pill',
  disabled: false,
  loading: false,
  loadingText: ''
})
</script>

<template>
  <Story title="Buttons/Button" :layout="{ type: 'grid', width: '280px' }">
    <Variant v-for="v in variants" :key="v" :title="`Variant: ${v}`">
      <div
        class="flex items-center justify-center p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <Button :variant="v">{{ `Button ${v}` }}</Button>
      </div>
    </Variant>

    <Variant title="Sizes Scale">
      <div
        class="flex items-center gap-3 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <Button v-for="s in sizes" :key="s" :size="s">{{ `Size ${s}` }}</Button>
      </div>
    </Variant>

    <Variant title="Shapes (Pill vs Rounded)">
      <div
        class="flex items-center gap-4 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <Button shape="pill">Pill Shape</Button>
        <Button shape="rounded">Rounded Shape</Button>
      </div>
    </Variant>

    <Variant title="Loading States">
      <div
        class="flex items-center gap-4 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <Button :loading="true">Chargement</Button>
        <Button :loading="true" loading-text="Enregistrement...">Sauvegarder</Button>
      </div>
    </Variant>

    <Variant title="Links">
      <div
        class="flex items-center gap-4 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <Button to="/internal-route">Lien interne</Button>
        <Button href="https://example.com" variant="secondary">Lien externe</Button>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <Button v-bind="state"> Action Button </Button>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.shape" title="Shape" :options="shapes" />
        <HstCheckbox v-model="state.disabled" title="Disabled" />
        <HstCheckbox v-model="state.loading" title="Loading" />
        <HstText v-model="state.loadingText" title="Loading Text" />
      </template>
    </Variant>
  </Story>
</template>
