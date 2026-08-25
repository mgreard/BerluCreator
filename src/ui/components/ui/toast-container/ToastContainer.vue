<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { activeToasts, removeToast, type ToastMessage } from '@/shared/services/toast.service'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { ToastContainerProps } from './types'

const { zIndex = 10000, class: className = undefined } = defineProps<ToastContainerProps>()

const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

function getIconName(type: ToastMessage['type']): string {
  switch (type) {
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    case 'success':
      return 'check_circle'
    case 'info':
    default:
      return 'info'
  }
}
</script>

<template>
  <Teleport v-if="isMounted" to="body">
    <div
      :class="
        cn(
          'fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-[420px] w-[calc(100vw-3rem)] pointer-events-none',
          className
        )
      "
      :style="{ zIndex }"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 translate-x-8 scale-95"
        enter-to-class="opacity-100 translate-x-0 scale-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <div
          v-for="toastItem in activeToasts"
          :key="toastItem.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-bg-elevated/95 backdrop-blur-2xl shadow-glass-xl relative overflow-hidden transition-all text-text-primary border',
            toastItem.type === 'error' && 'border-danger/60',
            toastItem.type === 'warning' && 'border-warning/60',
            toastItem.type === 'success' && 'border-success/60',
            toastItem.type === 'info' && 'border-info/60'
          ]"
          role="alert"
        >
          <div
            :class="[
              'shrink-0 p-1.5 rounded-xl flex items-center justify-center',
              toastItem.type === 'error' && 'bg-danger/15 text-danger',
              toastItem.type === 'warning' && 'bg-warning/15 text-warning',
              toastItem.type === 'success' && 'bg-success/15 text-success',
              toastItem.type === 'info' && 'bg-info/15 text-info'
            ]"
          >
            <Icon :name="getIconName(toastItem.type)" size="sm" />
          </div>

          <div class="flex-1 min-w-0 pt-0.5">
            <h4 class="font-bold text-sm text-text-primary mb-0.5 leading-snug">
              {{ toastItem.title }}
            </h4>
            <p class="text-xs text-text-secondary leading-relaxed break-words font-medium">
              {{ toastItem.message }}
            </p>
          </div>

          <button
            class="text-text-muted hover:text-text-primary transition-colors p-1.5 leading-none cursor-pointer touch-manipulation flex items-center justify-center rounded-lg hover:bg-bg-surface-hover/80"
            aria-label="Fermer la notification"
            title="Fermer la notification"
            @click="removeToast(toastItem.id)"
          >
            <Icon name="close" size="xs" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
