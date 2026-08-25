<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertDialogRoot,
  AlertDialogTrigger,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel
} from 'reka-ui'
import { cva } from 'class-variance-authority'
import { Button, type ButtonVariant } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { AlertDialogProps, AlertDialogEmits } from './types'

const alertDialogContentVariants = cva(
  'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg p-6 rounded-2xl bg-bg-elevated border border-border-default shadow-glass-2xl transition-all duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none select-none',
  {
    variants: {
      variant: {
        danger: 'border-danger/30 shadow-danger/5',
        warning: 'border-warning/30 shadow-warning/5',
        info: 'border-info/30 shadow-info/5',
        primary: 'border-primary/30 shadow-primary/5'
      }
    },
    defaultVariants: {
      variant: 'danger'
    }
  }
)

const open = defineModel<boolean>('open', { default: false })

const {
  title,
  description = undefined,
  variant = 'danger',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  icon = undefined,
  confirmLoading = false,
  confirmDisabled = false,
  requireConfirmationText = undefined,
  class: className = undefined
} = defineProps<AlertDialogProps>()

const emit = defineEmits<AlertDialogEmits>()

const typedConfirmation = ref('')

// Réinitialise la saisie de confirmation à l'ouverture/fermeture
watch(open, (isOpen) => {
  if (!isOpen) {
    typedConfirmation.value = ''
  }
})

const isConfirmationValid = computed(() => {
  if (!requireConfirmationText) return true
  return typedConfirmation.value === requireConfirmationText
})

const canConfirm = computed(() => {
  return isConfirmationValid.value && !confirmDisabled && !confirmLoading
})

const defaultIcon = computed(() => {
  if (icon) return icon
  switch (variant) {
    case 'danger':
      return 'delete_forever'
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    case 'primary':
    default:
      return 'auto_awesome'
  }
})

const iconBadgeClass = computed(() => {
  switch (variant) {
    case 'danger':
      return 'bg-danger/15 text-danger border-danger/20'
    case 'warning':
      return 'bg-warning/15 text-warning border-warning/20'
    case 'info':
      return 'bg-info/15 text-info border-info/20'
    case 'primary':
    default:
      return 'bg-primary/15 text-primary border-primary/20'
  }
})

const confirmButtonVariant = computed<ButtonVariant>(() => {
  switch (variant) {
    case 'danger':
      return 'destructive'
    case 'warning':
    case 'info':
    case 'primary':
    default:
      return 'primary'
  }
})

function handleConfirm() {
  if (!canConfirm.value) return
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <AlertDialogRoot v-model:open="open">
    <!-- Trigger optionnel -->
    <AlertDialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </AlertDialogTrigger>

    <AlertDialogPortal>
      <!-- Fond d'assombrissement avec flou -->
      <AlertDialogOverlay
        class="fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />

      <!-- Boîte de dialogue d'alerte -->
      <AlertDialogContent
        :class="cn(alertDialogContentVariants({ variant }), className)"
        data-surface="solid"
      >
        <div class="flex flex-col gap-5">
          <!-- En-tête avec icône d'alerte et titre -->
          <div class="flex items-start gap-4">
            <div
              :class="
                cn(
                  'flex items-center justify-center w-12 h-12 rounded-2xl border shrink-0 shadow-glass-xs',
                  iconBadgeClass
                )
              "
            >
              <Icon :name="defaultIcon" size="lg" />
            </div>

            <div class="flex-1 flex flex-col gap-1 min-w-0">
              <AlertDialogTitle class="font-display font-bold text-base text-text-primary m-0">
                <slot name="title">{{ title }}</slot>
              </AlertDialogTitle>
              <AlertDialogDescription
                v-if="description || $slots.description"
                class="text-xs text-text-secondary leading-relaxed m-0"
              >
                <slot name="description">{{ description }}</slot>
              </AlertDialogDescription>
              <AlertDialogDescription v-else class="sr-only">
                Confirmez ou annulez cette action.
              </AlertDialogDescription>
            </div>
          </div>

          <!-- Corps du dialogue (Slot ou saisie de confirmation requise) -->
          <div v-if="$slots.default || requireConfirmationText" class="flex flex-col gap-3">
            <slot />

            <div
              v-if="requireConfirmationText"
              class="flex flex-col gap-2 p-3.5 rounded-2xl bg-bg-surface/50 border border-border-default"
            >
              <span class="text-xs text-text-secondary">
                Pour confirmer cette action irréversible, veuillez saisir :
                <b class="text-danger font-mono select-all">{{ requireConfirmationText }}</b>
              </span>
              <input
                v-model="typedConfirmation"
                :placeholder="requireConfirmationText"
                type="text"
                class="w-full px-3.5 py-2.5 rounded-xl font-mono text-xs bg-bg-surface border border-border-default text-text-primary focus:outline-none focus:ring-2 focus:ring-danger focus:border-transparent transition-all"
                @keyup.enter="handleConfirm"
              />
            </div>
          </div>

          <!-- Pied de dialogue / Actions (Cancel & Confirm) -->
          <div class="flex items-center justify-end gap-3 pt-2">
            <slot name="footer">
              <AlertDialogCancel as-child>
                <Button variant="ghost" size="md" :disabled="confirmLoading" @click="handleCancel">
                  {{ cancelText }}
                </Button>
              </AlertDialogCancel>

              <AlertDialogAction as-child>
                <Button
                  :variant="confirmButtonVariant"
                  size="md"
                  :loading="confirmLoading"
                  :disabled="!canConfirm"
                  @click="handleConfirm"
                >
                  {{ confirmText }}
                </Button>
              </AlertDialogAction>
            </slot>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
