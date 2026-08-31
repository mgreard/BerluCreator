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
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  background: rgba(18, 14, 28, 0.92);
  color: var(--color-text-primary);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 24px rgba(168, 85, 247, 0.15);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  padding: 16px;
}

.driver-popover.berlu-product-tour .driver-popover-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.driver-popover.berlu-product-tour .driver-popover-description {
  font-size: 13px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 6px;
}

.driver-popover.berlu-product-tour .driver-popover-progress-text {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: #facc15;
  letter-spacing: 0.05em;
}

.driver-popover.berlu-product-tour .driver-popover-footer {
  margin-top: 14px;
}

.driver-popover.berlu-product-tour button {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  transition: all 150ms ease;
  text-shadow: none;
}

.driver-popover.berlu-product-tour button:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.driver-popover.berlu-product-tour .driver-popover-next-btn {
  border-color: #ffffff;
  background: #ffffff;
  color: #09090e;
  font-weight: 700;
}

.driver-popover.berlu-product-tour .driver-popover-next-btn:hover {
  background: #f4f4f5;
  transform: translateY(-1px);
}

.driver-popover.berlu-product-tour .driver-popover-close-btn {
  color: rgba(255, 255, 255, 0.5);
}

.driver-popover.berlu-product-tour .driver-popover-close-btn:hover {
  color: #ffffff;
}
</style>
