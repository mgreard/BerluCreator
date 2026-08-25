<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  VisuallyHidden
} from 'reka-ui'
import { cva } from 'class-variance-authority'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { DrawerProps, DrawerEmits } from './types'

const drawerVariants = cva(
  'fixed z-50 flex flex-col bg-bg-base/95 backdrop-blur-2xl text-text-primary shadow-glass-xl border-border-default outline-none transition ease-in-out duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
        left: 'inset-y-0 left-0 h-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
        top: 'inset-x-0 top-0 w-full border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 w-full border-t rounded-t-3xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom'
      }
    },
    defaultVariants: {
      side: 'right'
    }
  }
)

const isOpen = defineModel<boolean>('open', { default: false })

const {
  title = undefined,
  description = undefined,
  side = 'right',
  size = 'md',
  modal = true,
  portal = true,
  showClose = true,
  disabled = false,
  class: className = undefined
} = defineProps<DrawerProps>()

const emit = defineEmits<DrawerEmits>()

const dimensionClasses = computed(() => {
  const isHorizontal = side === 'left' || side === 'right'

  if (isHorizontal) {
    switch (size) {
      case 'sm':
        return 'w-80 max-w-[calc(100vw-1rem)]'
      case 'md':
        return 'w-96 max-w-[calc(100vw-1rem)]'
      case 'lg':
        return 'w-[480px] max-w-[calc(100vw-1rem)]'
      case 'xl':
        return 'w-[640px] max-w-[calc(100vw-1rem)]'
      case 'full':
        return 'w-screen'
      default:
        return 'w-96 max-w-[calc(100vw-1rem)]'
    }
  } else {
    // Vertical (top / bottom)
    switch (size) {
      case 'sm':
        return 'max-h-[30vh]'
      case 'md':
        return 'max-h-[50vh]'
      case 'lg':
        return 'max-h-[75vh]'
      case 'xl':
        return 'max-h-[90vh]'
      case 'full':
        return 'h-screen'
      default:
        return 'max-h-[60vh]'
    }
  }
})

const contentClasses = computed(() => {
  return cn(drawerVariants({ side }), dimensionClasses.value, className)
})

function handleOpenChange(val: boolean) {
  isOpen.value = val
  if (val) {
    emit('open')
  } else {
    emit('close')
  }
}

function toggle() {
  if (!disabled) {
    handleOpenChange(!isOpen.value)
  }
}
</script>

<template>
  <DialogRoot :open="isOpen" :modal="modal" @update:open="handleOpenChange">
    <DialogTrigger v-if="$slots.trigger" as-child :disabled="disabled">
      <slot name="trigger" :open="isOpen" :toggle="toggle" />
    </DialogTrigger>

    <component :is="portal ? DialogPortal : 'template'">
      <!-- Overlay d'assombrissement fluide avec flou -->
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-300"
      />

      <DialogContent :class="contentClasses">
        <VisuallyHidden v-if="$slots.header || !title">
          <DialogTitle>{{ title || 'Panneau latéral' }}</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden v-if="$slots.header || !description">
          <DialogDescription>{{ description || 'Contenu du panneau latéral' }}</DialogDescription>
        </VisuallyHidden>

        <!-- Poignée tactile de tirage (pour le mode bottom sheet) -->
        <div
          v-if="side === 'bottom'"
          class="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border-default/80 shrink-0"
          aria-hidden="true"
        />

        <!-- En-tête du Drawer -->
        <header
          v-if="title || description || $slots.header"
          class="flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0 bg-bg-surface/30"
        >
          <slot name="header">
            <div class="flex flex-col min-w-0 pr-4">
              <DialogTitle
                v-if="title"
                class="font-display text-base font-semibold text-text-primary m-0 truncate leading-tight"
              >
                {{ title }}
              </DialogTitle>
              <DialogDescription
                v-if="description"
                class="text-xs text-text-muted mt-1 m-0 leading-normal"
              >
                {{ description }}
              </DialogDescription>
            </div>
          </slot>

          <DialogClose v-if="showClose" as-child>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Fermer le tiroir"
              title="Fermer"
              class="text-text-muted hover:text-text-primary shrink-0 ml-auto"
            >
              <Icon name="close" size="xs" />
            </IconButton>
          </DialogClose>
        </header>

        <!-- Bouton de fermeture flottant si aucun en-tête n'est défini -->
        <DialogClose v-else-if="showClose" as-child>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Fermer le tiroir"
            title="Fermer"
            class="absolute top-3 right-3 z-10 text-text-muted hover:text-text-primary rounded-full bg-bg-surface border border-border-default hover:bg-bg-surface-hover"
          >
            <Icon name="close" size="xs" />
          </IconButton>
        </DialogClose>

        <!-- Corps scrollable du Drawer -->
        <div class="flex-1 overflow-y-auto overscroll-contain p-6">
          <slot />
        </div>

        <!-- Pied du Drawer -->
        <footer
          v-if="$slots.footer"
          class="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default bg-bg-surface/30 shrink-0"
        >
          <slot name="footer" />
        </footer>
      </DialogContent>
    </component>
  </DialogRoot>
</template>
