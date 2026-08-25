<script setup lang="ts">
import { computed } from 'vue'
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow
} from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { TooltipProps } from './types'

const isOpen = defineModel<boolean>('open')

const {
  content = undefined,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  delayDuration = 200,
  surface = 'solid',
  arrow = true,
  disabled = false,
  class: className = undefined
} = defineProps<TooltipProps>()

const contentClasses = computed(() => {
  return cn(
    'z-50 px-2.5 py-1 text-xs font-medium text-text-primary rounded-lg border select-none pointer-events-none max-w-xs',
    surface === 'glass'
      ? 'glass border-border-default shadow-glass-md'
      : 'bg-bg-elevated border-border-default shadow-glass-md',
    'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 duration-300 ease-out',
    className
  )
})
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration">
    <TooltipRoot :open="isOpen" :disabled="disabled" @update:open="(val) => (isOpen = val)">
      <TooltipTrigger as-child>
        <slot />
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent
          :side="side"
          :align="align"
          :side-offset="sideOffset"
          :collision-padding="8"
          :class="contentClasses"
          :data-surface="surface"
        >
          <slot name="content">
            {{ content }}
          </slot>

          <TooltipArrow
            v-if="arrow"
            :class="
              surface === 'glass'
                ? 'fill-bg-glass stroke-border-default'
                : 'fill-bg-elevated stroke-border-default'
            "
            :width="8"
            :height="4"
          />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
