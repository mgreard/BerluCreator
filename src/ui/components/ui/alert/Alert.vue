<script setup lang="ts">
import { ref, computed, useSlots, type Slots } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { AlertProps, AlertEmits } from './types'

const {
  variant = 'info',
  title = undefined,
  dismissible = false,
  showIcon = true,
  iconName = undefined,
  class: className = undefined
} = defineProps<AlertProps>()

const emit = defineEmits<AlertEmits>()

const slots: Slots = useSlots()
const isVisible = ref(true)

const defaultIcons: Record<string, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  danger: 'error'
}

const iconToDisplay = computed(() => {
  if (iconName) return iconName
  return defaultIcons[variant] || 'info'
})

const hasTitle = computed(() => Boolean(title) || Boolean(slots.title))

function handleDismiss() {
  isVisible.value = false
  emit('dismiss')
}

const classes = computed(() => {
  return cn(
    // Base
    'relative flex items-start gap-3 w-full p-3.5 rounded-2xl border backdrop-blur-md transition-all box-border mb-3 shadow-glass-sm',

    // Variants
    variant === 'info' && 'bg-info-bg border-info/30 text-info',
    variant === 'success' && 'bg-success-bg border-success/30 text-success',
    variant === 'warning' && 'bg-warning-bg border-warning/30 text-warning',
    variant === 'danger' && 'bg-danger-bg border-danger/30 text-danger',

    // Custom class override
    className
  )
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1.5"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-1.5"
  >
    <div v-if="isVisible" :class="classes" role="alert" aria-live="polite">
      <div v-if="showIcon" class="shrink-0 mt-0.5" aria-hidden="true">
        <slot name="icon">
          <Icon :name="iconToDisplay" size="md" />
        </slot>
      </div>

      <div class="flex-1 flex flex-col gap-1 min-w-0">
        <h4 v-if="hasTitle" class="text-sm font-bold m-0 leading-snug text-text-primary">
          <slot name="title">{{ title }}</slot>
        </h4>

        <div class="text-xs sm:text-sm leading-relaxed text-text-secondary">
          <slot />
        </div>

        <div v-if="$slots.actions" class="flex items-center gap-2 mt-2">
          <slot name="actions" />
        </div>
      </div>

      <button
        v-if="dismissible"
        type="button"
        class="text-inherit opacity-60 hover:opacity-100 p-1 -m-1 leading-none cursor-pointer transition-opacity touch-manipulation flex items-center justify-center"
        aria-label="Fermer l'alerte"
        @click="handleDismiss"
      >
        <Icon name="close" size="xs" />
      </button>
    </div>
  </Transition>
</template>
