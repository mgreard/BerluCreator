<script setup lang="ts">
import { ref } from 'vue'
import IconButton from './IconButton.vue'
import { Icon } from '@/components/ui/icon'
import type { IconButtonProps, IconButtonVariant, IconButtonSize } from './types'

const variants: IconButtonVariant[] = ['ghost', 'secondary', 'destructive', 'fav']
const sizes: IconButtonSize[] = ['xs', 'sm', 'md', 'lg']

const state = ref<IconButtonProps>({
  variant: 'ghost',
  size: 'md',
  active: false,
  disabled: false,
  ariaLabel: 'Action'
})
</script>

<template>
  <Story title="Buttons/IconButton" :layout="{ type: 'grid', width: '280px' }">
    <Variant v-for="v in variants" :key="v" :title="`Variant: ${v}`">
      <div
        class="flex items-center justify-center p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <IconButton :variant="v" aria-label="Exemple">
          <Icon name="settings" size="sm" />
        </IconButton>
      </div>
    </Variant>

    <Variant title="Sizes Scale (with Fitts target)">
      <div
        class="flex items-center gap-4 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <IconButton v-for="s in sizes" :key="s" :size="s" variant="secondary" aria-label="Taille">
          <Icon name="favorite" size="sm" />
        </IconButton>
      </div>
    </Variant>

    <Variant title="Favorite Toggle (Active vs Inactive)">
      <div
        class="flex items-center gap-4 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <IconButton variant="fav" :active="false" aria-label="Non favori">
          <Icon name="favorite" :filled="false" size="sm" />
        </IconButton>
        <IconButton variant="fav" :active="true" aria-label="Favori actif">
          <Icon name="favorite" :filled="true" size="sm" />
        </IconButton>
      </div>
    </Variant>

    <Variant title="Icon prop and slot priority">
      <div
        class="flex items-center gap-4 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <IconButton icon="download" aria-label="Télécharger" />
        <IconButton icon="delete" variant="destructive" aria-label="Supprimer">
          <Icon name="edit" size="sm" />
        </IconButton>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <IconButton v-bind="state">
            <Icon name="search" size="sm" />
          </IconButton>
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
