<script setup lang="ts">
import { ref } from 'vue'
import Avatar from './Avatar.vue'
import type { AvatarProps, AvatarSize, AvatarShape, AvatarStatus, AvatarVariant } from './types'

const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
const shapes: AvatarShape[] = ['circle', 'rounded', 'square']
const statuses: AvatarStatus[] = ['online', 'busy', 'away', 'offline']
const variants: AvatarVariant[] = ['default', 'bordered', 'glass']

const state = ref<AvatarProps>({
  name: 'Marie Curie',
  src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  size: 'lg',
  shape: 'circle',
  variant: 'default',
  status: 'online',
  clickable: true
})
</script>

<template>
  <Story title="Data Display/Avatar" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Sizes Scale">
      <div
        class="flex items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl flex-wrap"
      >
        <Avatar v-for="s in sizes" :key="s" name="Marie Curie" :size="s" />
      </div>
    </Variant>

    <Variant title="Shapes & Status">
      <div
        class="flex items-center justify-around p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Avatar name="Albert Einstein" shape="circle" status="online" size="lg" />
        <Avatar name="Ada Lovelace" shape="rounded" status="busy" size="lg" />
        <Avatar name="Alan Turing" shape="square" status="away" size="lg" />
      </div>
    </Variant>

    <Variant title="Automatic Initials Fallback">
      <div
        class="flex items-center gap-3 p-6 bg-bg-surface border border-border-default rounded-xl"
      >
        <Avatar name="Nikola Tesla" size="md" />
        <Avatar name="Guido van Rossum" size="md" />
        <Avatar fallback="AI" size="md" variant="glass" />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Avatar v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.name" title="Name" />
        <HstText v-model="state.src" title="Image URL" />
        <HstText v-model="state.fallback" title="Custom Fallback" />
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.shape" title="Shape" :options="shapes" />
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.status" title="Status" :options="['', ...statuses]" />
        <HstCheckbox v-model="state.clickable" title="Clickable" />
      </template>
    </Variant>
  </Story>
</template>
