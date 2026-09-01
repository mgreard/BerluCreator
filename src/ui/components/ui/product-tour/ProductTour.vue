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
    overlayOpacity: 0.88,
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
  border-radius: var(--radius-lg, 16px);
  background: var(--color-bg-elevated);
  color: var(--color-text-primary);
  box-shadow: var(--shadow-glass-lg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 16px;
  font-family: var(--font-sans);
  z-index: 100000;
}

/* ------------------------------------------------------------- */
/* Flèche directionnelle (Arrow) harmonisée avec le thème       */
/* ------------------------------------------------------------- */
.driver-popover.berlu-product-tour .driver-popover-arrow {
  border-width: 6px;
}

.driver-popover.berlu-product-tour .driver-popover-arrow-side-top {
  border-top-color: transparent;
  border-right-color: transparent;
  border-bottom-color: var(--color-bg-elevated);
  border-left-color: transparent;
}

.driver-popover.berlu-product-tour .driver-popover-arrow-side-bottom {
  border-top-color: var(--color-bg-elevated);
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: transparent;
}

.driver-popover.berlu-product-tour .driver-popover-arrow-side-left {
  border-top-color: transparent;
  border-right-color: var(--color-bg-elevated);
  border-bottom-color: transparent;
  border-left-color: transparent;
}

.driver-popover.berlu-product-tour .driver-popover-arrow-side-right {
  border-top-color: transparent;
  border-right-color: transparent;
  border-bottom-color: transparent;
  border-left-color: var(--color-bg-elevated);
}

/* ------------------------------------------------------------- */
/* Titre et Description                                          */
/* ------------------------------------------------------------- */
.driver-popover.berlu-product-tour .driver-popover-title {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
  letter-spacing: -0.01em;
  line-height: 1.35;
  padding-right: 28px;
}

.driver-popover.berlu-product-tour .driver-popover-description {
  font-family: var(--font-sans);
  font-size: 13px;
  line-height: 1.55;
  color: var(--color-text-secondary);
  margin-top: 8px;
}

/* ------------------------------------------------------------- */
/* Bouton Fermer (Style IconButton ghost)                        */
/* ------------------------------------------------------------- */
.driver-popover.berlu-product-tour .driver-popover-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border-radius: var(--radius-sm, 8px);
  border: 1px solid transparent;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 150ms ease;
  font-size: 16px;
  line-height: 1;
}

.driver-popover.berlu-product-tour .driver-popover-close-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-surface-hover);
  border-color: var(--color-border-default);
}

/* ------------------------------------------------------------- */
/* Pied de popover et boutons d'action                           */
/* ------------------------------------------------------------- */
.driver-popover.berlu-product-tour .driver-popover-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-subtle);
  gap: 8px;
}

.driver-popover.berlu-product-tour .driver-popover-progress-text {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-surface);
  padding: 2px 8px;
  border-radius: var(--radius-pill, 9999px);
  border: 1px solid var(--color-border-default);
}

.driver-popover.berlu-product-tour button {
  font-family: var(--font-sans);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md, 12px);
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  min-height: 32px;
  cursor: pointer;
  transition: all 150ms ease;
  text-shadow: none;
}

.driver-popover.berlu-product-tour button:hover {
  background: var(--color-bg-surface-hover);
  border-color: var(--color-border-hover);
  transform: translateY(-0.5px);
}

.driver-popover.berlu-product-tour .driver-popover-next-btn {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  box-shadow: var(--shadow-glass-sm);
}

.driver-popover.berlu-product-tour .driver-popover-next-btn:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  box-shadow: var(--shadow-glass-md);
  transform: translateY(-1px);
}
</style>
