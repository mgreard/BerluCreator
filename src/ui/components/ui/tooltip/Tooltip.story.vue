<script setup lang="ts">
import { ref } from 'vue'
import Tooltip from './Tooltip.vue'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import type { TooltipProps, TooltipSide, TooltipAlign } from './types'

const sides: TooltipSide[] = ['top', 'right', 'bottom', 'left']
const aligns: TooltipAlign[] = ['start', 'center', 'end']
const surfaces = ['solid', 'glass'] as const

const state = ref<TooltipProps>({
  content: 'Raccourci clavier : Ctrl + S',
  side: 'top',
  align: 'center',
  sideOffset: 4,
  surface: 'solid',
  arrow: true,
  disabled: false
})
</script>

<template>
  <Story title="Overlay/Tooltip" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="4 Sides Placement">
      <div
        class="flex items-center justify-around p-8 bg-bg-surface border border-border-default rounded-xl"
      >
        <Tooltip v-for="s in sides" :key="s" :side="s" :content="`Tooltip on ${s}`">
          <Button size="sm" variant="secondary">{{ s }}</Button>
        </Tooltip>
      </div>
    </Variant>

    <Variant title="With Icon Buttons">
      <div
        class="flex items-center gap-4 p-8 bg-bg-surface border border-border-default rounded-xl"
      >
        <Tooltip content="Ajouter aux favoris">
          <IconButton aria-label="Favoris">
            <Icon name="favorite" size="sm" />
          </IconButton>
        </Tooltip>

        <Tooltip content="Paramètres du compte" side="right">
          <IconButton aria-label="Paramètres">
            <Icon name="settings" size="sm" />
          </IconButton>
        </Tooltip>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Tooltip v-bind="state">
            <Button variant="primary">Survolez-moi</Button>
          </Tooltip>
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.content" title="Content" />
        <HstSelect v-model="state.side" title="Side" :options="sides" />
        <HstSelect v-model="state.align" title="Align" :options="aligns" />
        <HstNumber v-model="state.sideOffset" title="Side Offset" />
        <HstSelect v-model="state.surface" title="Surface" :options="surfaces" />
        <HstCheckbox v-model="state.arrow" title="Show Arrow" />
        <HstCheckbox v-model="state.disabled" title="Disabled" />
      </template>
    </Variant>
  </Story>
</template>
