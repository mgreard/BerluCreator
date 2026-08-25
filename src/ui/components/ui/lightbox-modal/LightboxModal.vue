<script setup lang="ts">
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose
} from 'reka-ui'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { LightboxModalProps, LightboxModalEmits } from './types'

const {
  imageUrl,
  altText = undefined,
  caption = undefined,
  zIndex = 1000,
  class: className = undefined
} = defineProps<LightboxModalProps>()

const open = defineModel<boolean>('open', { default: true })

const emit = defineEmits<LightboxModalEmits>()

function handleOpenChange(val: boolean) {
  open.value = val
  if (!val) {
    emit('close')
  }
}
</script>

<template>
  <DialogRoot :open="open" @update:open="handleOpenChange">
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/88 backdrop-blur-md transition-opacity duration-200"
        :style="{ zIndex }"
      />
      <DialogContent
        :class="
          cn(
            'fixed inset-0 z-50 flex items-center justify-center p-6 outline-none pointer-events-none',
            className
          )
        "
        :style="{ zIndex }"
      >
        <DialogTitle class="sr-only">
          {{ caption || altText || 'Visualisation de l’image' }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ altText || caption || 'Aperçu de l’image en plein écran' }}
        </DialogDescription>

        <DialogClose as-child>
          <IconButton
            variant="ghost"
            size="md"
            aria-label="Fermer la modal"
            title="Fermer (Échap)"
            class="absolute top-6 right-6 z-50 text-white bg-black/40 hover:bg-black/60 border border-white/20 rounded-full pointer-events-auto"
          >
            <Icon name="close" size="xs" />
          </IconButton>
        </DialogClose>

        <div
          class="flex flex-col items-center justify-center max-w-[92vw] max-h-[92vh] pointer-events-auto"
        >
          <img
            :src="imageUrl"
            :alt="altText || caption || 'Image grand format'"
            class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-glass-lg border border-white/15"
          />
          <p v-if="caption" class="mt-3 text-sm text-center text-text-secondary select-none">
            {{ caption }}
          </p>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
