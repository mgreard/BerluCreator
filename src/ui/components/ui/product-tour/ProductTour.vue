<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { ProductTourEmits, ProductTourProps } from './types'

const {
  steps,
  autoStart = false,
  storageKey = 'product-tour.completed',
  startDelayMs = 900,
  config = {}
} = defineProps<ProductTourProps>()

const emit = defineEmits<ProductTourEmits>()
let instance: Driver | null = null
let startTimer: number | null = null

function markCompleted() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(storageKey, 'true')
  }
}

function start(stepIndex = 0) {
  instance?.destroy()
  const configuredOnDestroyed = config.onDestroyed
  instance = driver({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    allowKeyboardControl: true,
    showProgress: true,
    progressText: '{{current}} / {{total}}',
    nextBtnText: 'Suivant',
    prevBtnText: 'Précédent',
    doneBtnText: 'Terminer',
    overlayColor: '#09090f',
    overlayOpacity: 0.78,
    stagePadding: 8,
    stageRadius: 12,
    popoverClass: 'berlu-product-tour',
    ...config,
    steps,
    onDestroyed: (element, step, options) => {
      markCompleted()
      configuredOnDestroyed?.(element, step, options)
      emit('finished')
    }
  })
  emit('started')
  instance.drive(stepIndex)
}

function reset() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey)
  }
}

onMounted(() => {
  if (!autoStart || window.localStorage.getItem(storageKey) === 'true') return
  startTimer = window.setTimeout(() => start(), Math.max(0, startDelayMs))
})

onBeforeUnmount(() => {
  if (startTimer !== null) window.clearTimeout(startTimer)
  instance?.destroy()
})

defineExpose({ start, reset })
</script>

<template>
  <span class="hidden" aria-hidden="true" />
</template>

<style>
.driver-popover.berlu-product-tour {
  max-width: 360px;
  border: 1px solid var(--color-border-default);
  border-radius: 16px;
  background: color-mix(in srgb, var(--color-bg-elevated) 94%, transparent);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-glass-xl);
  backdrop-filter: blur(20px);
}

.driver-popover.berlu-product-tour .driver-popover-title {
  font-family: var(--font-display);
  font-size: 15px;
  color: var(--color-text-primary);
}

.driver-popover.berlu-product-tour .driver-popover-description,
.driver-popover.berlu-product-tour .driver-popover-progress-text {
  color: var(--color-text-secondary);
}

.driver-popover.berlu-product-tour button {
  border: 1px solid var(--color-border-default);
  border-radius: 10px;
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  text-shadow: none;
}

.driver-popover.berlu-product-tour .driver-popover-next-btn {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.driver-popover.berlu-product-tour .driver-popover-close-btn {
  color: var(--color-text-muted);
}
</style>
