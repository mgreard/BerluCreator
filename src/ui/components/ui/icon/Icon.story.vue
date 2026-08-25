<script setup lang="ts">
import { ref } from 'vue'
import Icon from './Icon.vue'
import type { IconProps, IconSize } from './types'

const commonIcons = [
  'search',
  'home',
  'settings',
  'favorite',
  'check',
  'close',
  'notifications',
  'menu',
  'add',
  'delete',
  'edit',
  'share'
]
const sizes: IconSize[] = ['xs', 'sm', 'md', 'lg', 'xl']

const state = ref<IconProps>({
  name: 'favorite',
  size: 'md',
  filled: false,
  color: ''
})
</script>

<template>
  <Story title="Primitives/Icon" :layout="{ type: 'grid', width: '280px' }">
    <Variant title="Common Icons Gallery">
      <div class="grid grid-cols-4 gap-4 p-4 bg-bg-surface border border-border-default rounded-xl">
        <div
          v-for="iconName in commonIcons"
          :key="iconName"
          class="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-bg-surface-hover/50 text-center"
        >
          <Icon :name="iconName" size="md" />
          <span class="text-[10px] text-text-muted truncate w-full">{{ iconName }}</span>
        </div>
      </div>
    </Variant>

    <Variant title="Sizes Scale">
      <div class="flex items-end gap-4 p-4 bg-bg-surface border border-border-default rounded-xl">
        <div v-for="s in sizes" :key="s" class="flex flex-col items-center gap-2">
          <Icon name="settings" :size="s" />
          <span class="text-xs text-text-muted">{{ s }}</span>
        </div>
      </div>
    </Variant>

    <Variant title="Filled vs Outlined">
      <div
        class="flex items-center gap-6 p-4 bg-bg-surface border border-border-default rounded-xl"
      >
        <div class="flex items-center gap-2">
          <Icon name="favorite" :filled="false" size="lg" />
          <span class="text-xs text-text-muted">Outlined</span>
        </div>
        <div class="flex items-center gap-2 text-danger">
          <Icon name="favorite" :filled="true" size="lg" />
          <span class="text-xs text-text-muted">Filled</span>
        </div>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
        >
          <Icon v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.name" title="Icon Name" :options="commonIcons" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstCheckbox v-model="state.filled" title="Filled" />
      </template>
    </Variant>
  </Story>
</template>
