<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId, useTemplateRef, watch } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type {
  DepthOfFieldOverlayEmits,
  DepthOfFieldOverlayProps,
  DepthOfFieldOverlayValue
} from './types'

interface LineInteraction {
  pointerId: number
  target: HTMLElement
}

const model = defineModel<DepthOfFieldOverlayValue>({ required: true })
const {
  stageHeight,
  disabled = false,
  class: className = undefined
} = defineProps<DepthOfFieldOverlayProps>()
const emit = defineEmits<DepthOfFieldOverlayEmits>()

const overlayRef = useTemplateRef<HTMLDivElement>('overlay')
const descriptionId = useId()
const lineInteraction = ref<LineInteraction | null>(null)
const draft = ref<DepthOfFieldOverlayValue>({ ...model.value })

watch(
  model,
  (value) => {
    if (!lineInteraction.value) {
      draft.value = { ...value }
    }
  },
  { deep: true }
)

const focusPercent = computed(() => Math.round(draft.value.focusY * 100))
const focusStyle = computed(() => ({ top: `${draft.value.focusY * 100}%` }))
const blurZoneStyle = computed(() => ({ height: `${draft.value.focusY * 100}%` }))

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function setValue(changes: Partial<DepthOfFieldOverlayValue>) {
  const next = { ...draft.value, ...changes }
  draft.value = next
  model.value = next
  emit('change', next)
}

function focusFromPointer(event: PointerEvent): number | null {
  const rect = overlayRef.value?.getBoundingClientRect()
  if (!rect?.height || stageHeight <= 0) return null
  const stageY = (event.clientY - rect.top) * (stageHeight / rect.height)
  return clamp(stageY / stageHeight, 0, 1)
}

function beginLineInteraction(event: PointerEvent) {
  if (disabled || event.button !== 0) return
  event.stopPropagation()
  const target = event.currentTarget as HTMLElement
  target.setPointerCapture?.(event.pointerId)
  lineInteraction.value = { pointerId: event.pointerId, target }
  emit('interaction-start', 'Déplacer la limite de netteté')
  const focusY = focusFromPointer(event)
  if (focusY !== null) setValue({ focusY })
}

function moveLine(event: PointerEvent) {
  const interaction = lineInteraction.value
  if (!interaction || interaction.pointerId !== event.pointerId) return
  event.stopPropagation()
  const focusY = focusFromPointer(event)
  if (focusY !== null) setValue({ focusY })
}

function finishLineInteraction(event: PointerEvent) {
  const interaction = lineInteraction.value
  if (!interaction || interaction.pointerId !== event.pointerId) return
  event.stopPropagation()
  const focusY = focusFromPointer(event)
  if (focusY !== null) setValue({ focusY })
  if (interaction.target.hasPointerCapture?.(event.pointerId)) {
    interaction.target.releasePointerCapture(event.pointerId)
  }
  lineInteraction.value = null
  emit('commit', { ...draft.value })
}

function moveLineWithKeyboard(event: KeyboardEvent) {
  if (disabled) return
  const step = event.shiftKey ? 0.05 : 0.01
  let focusY = draft.value.focusY
  if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') focusY -= step
  else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') focusY += step
  else if (event.key === 'Home') focusY = 0
  else if (event.key === 'End') focusY = 1
  else return

  event.preventDefault()
  emit('interaction-start', 'Déplacer la limite de netteté')
  setValue({ focusY: clamp(focusY, 0, 1) })
  emit('commit', { ...draft.value })
}

onBeforeUnmount(() => {
  if (lineInteraction.value) {
    emit('commit', { ...draft.value })
  }
})
</script>

<template>
  <div
    ref="overlay"
    :class="cn('absolute inset-0 z-20 pointer-events-none', className)"
    data-depth-overlay
    :aria-describedby="descriptionId"
    @pointermove="moveLine"
    @pointerup="finishLineInteraction"
    @pointercancel="finishLineInteraction"
  >
    <span :id="descriptionId" class="sr-only">
      Les plans lointains sont progressivement floutés au-dessus de la limite et les plans proches
      sous celle-ci. Déplacez la limite ou utilisez les réglages pour ajuster l’effet.
    </span>

    <div class="absolute inset-x-0 top-0 bg-primary/5" :style="blurZoneStyle" aria-hidden="true" />

    <div
      class="absolute inset-x-0 flex min-h-[44px] -translate-y-1/2 cursor-ns-resize touch-none items-center outline-none pointer-events-auto focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      :class="disabled && 'pointer-events-none opacity-50'"
      :style="focusStyle"
      role="slider"
      tabindex="0"
      aria-label="Position verticale de la limite de netteté"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="focusPercent"
      :aria-valuetext="`Focus à ${focusPercent} % de la hauteur`"
      data-focus-line
      @pointerdown="beginLineInteraction"
      @keydown="moveLineWithKeyboard"
    >
      <div class="w-full border-t-2 border-dashed border-primary/80" aria-hidden="true" />
      <div
        class="absolute left-3 flex min-h-[44px] items-center gap-1.5 rounded-xl border border-primary/50 bg-bg-elevated px-3 text-[11px] font-semibold text-text-primary shadow-md"
      >
        <Icon name="height" size="xs" class="text-primary" />
        <span>Limite de netteté {{ focusPercent }} %</span>
      </div>
    </div>
  </div>
</template>
