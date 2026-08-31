<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverAnchor,
  PopoverPortal,
  PopoverContent,
  PopoverArrow,
  PopoverClose,
  useForwardPropsEmits,
  type PopoverContentProps
} from 'reka-ui'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { PopoverProps, PopoverEmits } from './types'
import { guardPopoverOutsideInteraction } from './outside-interaction'

defineOptions({ inheritAttrs: false })

const isOpen = defineModel<boolean>({ default: false })

const {
  title = undefined,
  description = undefined,
  side = 'bottom',
  align = 'center',
  sideOffset = 8,
  alignOffset = 0,
  width = 'md',
  surface = 'solid',
  arrow = false,
  modal = false,
  portal = true,
  portalTo = 'body',
  portalDefer = true,
  avoidCollisions = true,
  collisionBoundary = undefined,
  collisionPadding = 8,
  positionStrategy = 'fixed',
  sticky = 'partial',
  hideWhenDetached = true,
  ignoreOutsideInteractionSelector = undefined,
  updatePositionStrategy = 'optimized',
  showClose = true,
  closeOnCloseButtonOnly = false,
  disabled = false,
  class: className = undefined,
  bodyClass = undefined
} = defineProps<PopoverProps>()

const emit = defineEmits<PopoverEmits>()
const attrs = useAttrs()

const contentPositionProps = computed<PopoverContentProps>(() => ({
  side,
  align,
  sideOffset,
  alignOffset,
  avoidCollisions,
  collisionBoundary,
  collisionPadding,
  positionStrategy,
  sticky,
  hideWhenDetached,
  updatePositionStrategy
}))
const forwardedContentProps = useForwardPropsEmits(contentPositionProps)
const forwardedContent = computed(() => ({ ...forwardedContentProps.value, ...attrs }))

const widthClasses = computed(() => {
  switch (width) {
    case 'auto':
      return 'w-auto'
    case 'sm':
      return 'w-64 max-w-[calc(100vw-2rem)]'
    case 'md':
      return 'w-80 max-w-[calc(100vw-2rem)]'
    case 'lg':
      return 'w-96 max-w-[calc(100vw-2rem)]'
    case 'xl':
      return 'w-[440px] max-w-[calc(100vw-2rem)]'
    case 'trigger':
      return 'w-[var(--reka-popover-trigger-width)]'
    default:
      return width || 'w-80 max-w-[calc(100vw-2rem)]'
  }
})

const contentClasses = computed(() => {
  return cn(
    'z-50 flex flex-col rounded-[var(--radius-md,12px)] border text-text-primary outline-none select-normal overflow-hidden',
    surface === 'glass'
      ? 'viewport-glass border-border-default shadow-glass-lg'
      : 'bg-bg-elevated border-border-default shadow-glass-lg',
    'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 duration-300 ease-out',
    widthClasses.value,
    className
  )
})

function handleOpenChange(val: boolean) {
  if (!val && closeOnCloseButtonOnly) return
  setOpen(val)
}

function setOpen(val: boolean) {
  isOpen.value = val
  if (val) {
    emit('open')
  } else {
    emit('close')
  }
}

function closeFromButton() {
  setOpen(false)
}

function toggle() {
  if (!disabled) {
    handleOpenChange(!isOpen.value)
  }
}

function handlePointerDownOutside(event: Event): void {
  guardPopoverOutsideInteraction(event, ignoreOutsideInteractionSelector)
}
</script>

<template>
  <PopoverRoot :open="isOpen" :modal="modal" @update:open="handleOpenChange">
    <PopoverTrigger v-if="$slots.trigger" as-child :disabled="disabled">
      <slot name="trigger" :open="isOpen" :toggle="toggle" />
    </PopoverTrigger>

    <PopoverAnchor v-if="$slots.anchor" as-child>
      <slot name="anchor" />
    </PopoverAnchor>

    <component
      :is="portal ? PopoverPortal : 'template'"
      :to="portal ? portalTo : undefined"
      :defer="portal ? portalDefer : undefined"
    >
      <PopoverContent
        v-bind="forwardedContent"
        :class="contentClasses"
        :data-surface="surface"
        @pointer-down-outside="handlePointerDownOutside"
      >
        <!-- En-tête du Popover -->
        <header
          v-if="title || description || $slots.header"
          :class="
            cn(
              'flex items-center justify-between px-4 py-3 border-b border-border-default shrink-0',
              surface === 'glass' ? 'bg-bg-surface/40' : 'bg-bg-elevated'
            )
          "
        >
          <slot name="header">
            <div class="flex flex-col min-w-0 pr-2">
              <h4
                v-if="title"
                class="font-display text-sm font-semibold text-text-primary m-0 truncate leading-tight"
              >
                {{ title }}
              </h4>
              <p v-if="description" class="text-xs text-text-muted mt-0.5 m-0 leading-normal">
                {{ description }}
              </p>
            </div>
          </slot>

          <IconButton
            v-if="showClose && closeOnCloseButtonOnly"
            variant="ghost"
            size="xs"
            aria-label="Fermer"
            title="Fermer"
            class="text-text-muted hover:text-text-primary shrink-0 ml-auto"
            @click="closeFromButton"
          >
            <Icon name="close" size="xs" />
          </IconButton>

          <PopoverClose v-else-if="showClose" as-child>
            <IconButton
              variant="ghost"
              size="xs"
              aria-label="Fermer"
              title="Fermer"
              class="text-text-muted hover:text-text-primary shrink-0 ml-auto"
            >
              <Icon name="close" size="xs" />
            </IconButton>
          </PopoverClose>
        </header>

        <!-- Bouton de fermeture flottant si aucun header n'est rendu -->
        <IconButton
          v-else-if="showClose && closeOnCloseButtonOnly"
          variant="ghost"
          size="xs"
          aria-label="Fermer"
          title="Fermer"
          class="absolute top-2.5 right-2.5 z-10 text-text-muted hover:text-text-primary rounded-full bg-bg-surface/90 border border-border-default hover:bg-bg-surface-hover shadow-xs"
          @click="closeFromButton"
        >
          <Icon name="close" size="xs" />
        </IconButton>

        <PopoverClose v-else-if="showClose" as-child>
          <IconButton
            variant="ghost"
            size="xs"
            aria-label="Fermer"
            title="Fermer"
            class="absolute top-2.5 right-2.5 z-10 text-text-muted hover:text-text-primary rounded-full bg-bg-surface/90 border border-border-default hover:bg-bg-surface-hover shadow-xs"
          >
            <Icon name="close" size="xs" />
          </IconButton>
        </PopoverClose>

        <!-- Corps du Popover (défilement fluide) -->
        <div
          :class="cn('flex-1 overflow-y-auto overscroll-contain max-h-[min(var(--reka-popover-content-available-height,400px),420px)] p-3', bodyClass)"
        >
          <slot />
        </div>

        <!-- Pied du Popover -->
        <footer
          v-if="$slots.footer"
          :class="
            cn(
              'flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border-default shrink-0',
              surface === 'glass' ? 'bg-bg-surface/40' : 'bg-bg-elevated'
            )
          "
        >
          <slot name="footer" />
        </footer>

        <!-- Flèche optionnelle -->
        <PopoverArrow
          v-if="arrow"
          :class="
            surface === 'glass'
              ? 'fill-bg-glass stroke-border-default'
              : 'fill-bg-elevated stroke-border-default'
          "
          :width="12"
          :height="6"
        />
      </PopoverContent>
    </component>
  </PopoverRoot>
</template>
