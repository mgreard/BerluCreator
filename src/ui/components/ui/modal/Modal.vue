<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  VisuallyHidden
} from 'reka-ui'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { ModalProps, ModalEmits } from './types'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

// Support v-model:isOpen et v-model standard
const isOpenModel = defineModel<boolean>('isOpen')
const defaultModel = defineModel<boolean>()

const isVisible = computed({
  get: () => isOpenModel.value ?? defaultModel.value ?? false,
  set: (val: boolean) => {
    if (isOpenModel.value !== undefined) isOpenModel.value = val
    if (defaultModel.value !== undefined) defaultModel.value = val
    if (isOpenModel.value === undefined && defaultModel.value === undefined) {
      isOpenModel.value = val
    }
  }
})

const {
  title = undefined,
  subtitle = undefined,
  size = 'md',
  surface = 'solid',
  closeOnBackdrop = true,
  zIndex = 1100,
  class: className = undefined
} = defineProps<ModalProps>()

const emit = defineEmits<ModalEmits>()

const modalClasses = computed(() => {
  return cn(
    'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col w-[calc(100%-2rem)] max-h-[90vh] rounded-2xl overflow-hidden outline-none text-text-primary border',
    'transition-all duration-300 ease-out animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
    surface === 'glass'
      ? 'glass-premium border-border-default shadow-glass-lg'
      : 'bg-bg-elevated border-border-default shadow-glass-lg',
    size === 'sm' && 'max-w-[440px]',
    size === 'md' && 'max-w-[600px]',
    size === 'lg' && 'max-w-[800px]',
    size === 'xl' && 'max-w-[1100px]',
    size === 'fullscreen' && 'w-[96vw] h-[96vh] max-w-none max-h-none',
    className
  )
})

function handleOpenChange(val: boolean) {
  isVisible.value = val
  if (val) {
    emit('open')
  } else {
    emit('close')
  }
}
</script>

<template>
  <DialogRoot :open="isVisible" @update:open="handleOpenChange">
    <DialogPortal to="body">
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/55 transition-opacity duration-300 ease-out animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        :style="{ zIndex }"
        @pointerdown="!closeOnBackdrop ? $event.preventDefault() : undefined"
      />
      <DialogContent
        v-bind="attrs"
        :class="modalClasses"
        :data-surface="surface"
        :style="{ zIndex: zIndex ? Number(zIndex) + 1 : undefined }"
        @pointer-down-outside="!closeOnBackdrop ? $event.preventDefault() : undefined"
      >
        <!-- Titre et description accessibles garantis si le header libre ne fournit pas les primitives Reka. -->
        <VisuallyHidden v-if="$slots.header || !title">
          <DialogTitle>{{ title || 'Fenêtre de dialogue' }}</DialogTitle>
        </VisuallyHidden>
        <VisuallyHidden v-if="$slots.header || !subtitle">
          <DialogDescription>{{ subtitle || 'Contenu de la modale' }}</DialogDescription>
        </VisuallyHidden>

        <header
          v-if="title || subtitle || $slots.header"
          :class="
            cn(
              'flex items-center justify-between px-6 py-4 border-b border-border-default shrink-0',
              surface === 'glass' ? 'bg-bg-surface/40' : 'bg-bg-elevated'
            )
          "
        >
          <slot name="header">
            <div class="flex flex-col pr-4">
              <DialogTitle
                v-if="title"
                class="font-display text-lg font-bold text-text-primary m-0 leading-tight"
              >
                {{ title }}
              </DialogTitle>
              <DialogDescription
                v-if="subtitle"
                class="text-xs text-text-muted mt-0.5 leading-normal"
              >
                {{ subtitle }}
              </DialogDescription>
            </div>
          </slot>

          <DialogClose as-child>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Fermer"
              title="Fermer"
              class="text-text-muted hover:text-text-primary shrink-0"
            >
              <Icon name="close" size="xs" />
            </IconButton>
          </DialogClose>
        </header>

        <DialogClose v-else as-child>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Fermer"
            title="Fermer"
            class="absolute top-3 right-3 z-50 bg-bg-elevated border border-border-default text-text-muted hover:text-danger hover:bg-danger-bg rounded-full shadow-sm"
          >
            <Icon name="close" size="xs" />
          </IconButton>
        </DialogClose>

        <div
          :class="
            cn(
              'flex-1 p-6 overflow-y-auto overscroll-contain text-text-primary',
              !title && !subtitle && !$slots.header && 'pt-10',
              size === 'fullscreen' && 'h-full flex flex-col'
            )
          "
        >
          <slot />
        </div>

        <footer
          v-if="$slots.footer"
          :class="
            cn(
              'flex items-center justify-end gap-3 px-6 py-4 border-t border-border-default shrink-0',
              surface === 'glass' ? 'bg-bg-surface/40' : 'bg-bg-elevated'
            )
          "
        >
          <slot name="footer" />
        </footer>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
