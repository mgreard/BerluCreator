<script setup lang="ts">
import { ref } from 'vue'
import AvatarGroup from './AvatarGroup.vue'
import { Avatar, type AvatarSize, type AvatarShape } from '@/components/ui/avatar'
import type { AvatarGroupProps, AvatarGroupSpacing } from './types'

const sizes: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const shapes: AvatarShape[] = ['circle', 'rounded', 'square']
const spacings: AvatarGroupSpacing[] = ['tight', 'normal', 'loose']

const state = ref<AvatarGroupProps>({
  size: 'md',
  shape: 'circle',
  spacing: 'normal',
  ariaLabel: "Membres de l'équipe"
})
</script>

<template>
  <Story title="Data Display/AvatarGroup" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Team Overlap">
      <div
        class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
      >
        <AvatarGroup size="md">
          <Avatar name="Marie Curie" status="online" />
          <Avatar name="Albert Einstein" status="busy" />
          <Avatar name="Ada Lovelace" status="online" />
          <Avatar name="Alan Turing" />
          <Avatar fallback="+5" variant="glass" />
        </AvatarGroup>
      </div>
    </Variant>

    <Variant title="Rounded & Tight Spacing">
      <div
        class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl"
      >
        <AvatarGroup size="lg" shape="rounded" spacing="tight">
          <Avatar name="Guido van Rossum" />
          <Avatar name="Brendan Eich" />
          <Avatar name="Linus Torvalds" />
          <Avatar fallback="+12" variant="glass" />
        </AvatarGroup>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <AvatarGroup v-bind="state">
            <Avatar name="Alexandre Dumas" status="online" />
            <Avatar name="Victor Hugo" status="away" />
            <Avatar name="Emile Zola" status="busy" />
            <Avatar fallback="+3" variant="glass" />
          </AvatarGroup>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.size" title="Size" :options="sizes" />
        <HstSelect v-model="state.shape" title="Shape" :options="shapes" />
        <HstSelect v-model="state.spacing" title="Spacing" :options="spacings" />
        <HstText v-model="state.ariaLabel" title="Aria Label" />
      </template>
    </Variant>
  </Story>
</template>
