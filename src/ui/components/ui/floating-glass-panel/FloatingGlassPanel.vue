<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch
} from 'vue'
import { IconButton } from '@/components/ui/icon-button'
import { Heading } from '@/components/ui/heading'
import { cn } from '@/shared/utils/cn'
import type {
  FloatingGlassPanelEmits,
  FloatingGlassPanelProps,
  FloatingGlassPanelSlots
} from './types'

interface Position {
  x: number
  y: number
}

interface DragState {
  pointerId: number
  target: HTMLElement
  offsetX: number
  offsetY: number
}

const open = defineModel<boolean>('open', { required: true })
const {
  panelId,
  title,
  subtitle = undefined,
  defaultPlacement = 'top-right',
  chrome = 'panel',
  teleportTarget = '#studio-overlay-host',
  class: className = undefined
} = defineProps<FloatingGlassPanelProps>()
const emit = defineEmits<FloatingGlassPanelEmits>()
defineSlots<FloatingGlassPanelSlots>()
defineOptions({ inheritAttrs: false })

const panelRef = useTemplateRef<HTMLElement>('panel')
const attrs = useAttrs()
const resolvedTarget = ref<HTMLElement | null>(null)
const position = ref<Position>({ x: 8, y: 8 })
const drag = ref<DragState | null>(null)
const titleId = useId()
const margin = 8
let resizeObserver: ResizeObserver | null = null

const isDragging = computed(() => drag.value !== null)
const panelStyle = computed(() => ({
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  maxWidth: `calc(100% - ${margin * 2}px)`,
  maxHeight: `calc(100% - ${margin * 2}px)`
}))

function getContainer(): HTMLElement | null {
  return resolvedTarget.value ?? panelRef.value?.parentElement ?? null
}

function boundedPosition(x: number, y: number): Position {
  const container = getContainer()
  const panel = panelRef.value
  if (!container || !panel) return { x: margin, y: margin }
  const containerRect = container.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  return {
    x: Math.min(Math.max(x, margin), Math.max(margin, containerRect.width - panelRect.width - margin)),
    y: Math.min(Math.max(y, margin), Math.max(margin, containerRect.height - panelRect.height - margin))
  }
}

function resetPosition(): void {
  const container = getContainer()
  const panel = panelRef.value
  if (!container || !panel) return
  const containerRect = container.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const placements = {
    'top-left': { x: margin, y: margin },
    'top-right': { x: containerRect.width - panelRect.width - margin, y: margin },
    'bottom-left': { x: margin, y: containerRect.height - panelRect.height - margin },
    'bottom-right': {
      x: containerRect.width - panelRect.width - margin,
      y: containerRect.height - panelRect.height - margin
    },
    'bottom-center': {
      x: (containerRect.width - panelRect.width) / 2,
      y: containerRect.height - panelRect.height - margin
    }
  }
  const next = placements[defaultPlacement]
  position.value = boundedPosition(next.x, next.y)
}

function constrain(): void {
  position.value = boundedPosition(position.value.x, position.value.y)
}

function beginDrag(event: PointerEvent): void {
  if (event.button !== 0) return
  const panel = panelRef.value
  if (!panel) return
  event.preventDefault()
  event.stopPropagation()
  const panelRect = panel.getBoundingClientRect()
  const target = event.currentTarget as HTMLElement
  drag.value = {
    pointerId: event.pointerId,
    target,
    offsetX: event.clientX - panelRect.left,
    offsetY: event.clientY - panelRect.top
  }
  target.setPointerCapture?.(event.pointerId)
  emit('drag-start')
}

function moveDrag(event: PointerEvent): void {
  const active = drag.value
  const container = getContainer()
  if (!active || active.pointerId !== event.pointerId || !container) return
  event.preventDefault()
  event.stopPropagation()
  const containerRect = container.getBoundingClientRect()
  position.value = boundedPosition(
    event.clientX - containerRect.left - active.offsetX,
    event.clientY - containerRect.top - active.offsetY
  )
}

function endDrag(event: PointerEvent): void {
  const active = drag.value
  if (!active || active.pointerId !== event.pointerId) return
  event.preventDefault()
  event.stopPropagation()
  if (active.target.hasPointerCapture?.(event.pointerId)) {
    active.target.releasePointerCapture(event.pointerId)
  }
  drag.value = null
  emit('drag-end')
}

function nudge(event: KeyboardEvent): void {
  const direction = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1]
  }[event.key]
  if (!direction) return
  event.preventDefault()
  event.stopPropagation()
  const step = event.shiftKey ? 24 : 8
  position.value = boundedPosition(
    position.value.x + direction[0] * step,
    position.value.y + direction[1] * step
  )
}

function close(): void {
  open.value = false
}

async function preparePanel(): Promise<void> {
  await nextTick()
  resetPosition()
  resizeObserver?.disconnect()
  const container = getContainer()
  if (typeof ResizeObserver !== 'undefined' && container && panelRef.value) {
    resizeObserver = new ResizeObserver(constrain)
    resizeObserver.observe(container)
    resizeObserver.observe(panelRef.value)
  }
}

watch(open, (isOpen) => {
  if (isOpen) void preparePanel()
  else resizeObserver?.disconnect()
})

onMounted(() => {
  resolvedTarget.value = document.querySelector<HTMLElement>(teleportTarget)
  if (open.value) void preparePanel()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
const isBottomPlacement = computed(() => defaultPlacement.startsWith('bottom'))
const attachedAlignClass = computed(() => {
  if (defaultPlacement === 'bottom-center') return 'items-center'
  if (defaultPlacement === 'top-left' || defaultPlacement === 'bottom-left') return 'items-start'
  return 'items-end'
})
</script>

<template>
  <Teleport :to="resolvedTarget ?? 'body'" :disabled="!resolvedTarget">
    <section
      v-if="open"
      ref="panel"
      v-bind="attrs"
      :data-studio-panel="panelId"
      :class="cn(
        'absolute z-50 flex min-h-0 text-white/90',
        $slots.attached
          ? cn('pointer-events-none gap-2', isBottomPlacement ? 'flex-col-reverse' : 'flex-col', attachedAlignClass)
          : chrome === 'toolbar'
            ? 'viewport-glass pointer-events-auto overflow-hidden rounded-2xl border shadow-glass-xl items-center px-2 py-1.5'
            : 'viewport-glass pointer-events-auto flex-col overflow-hidden rounded-2xl border shadow-glass-xl',
        className
      )"
      :style="panelStyle"
      role="region"
      :aria-labelledby="titleId"
      @pointerdown.stop
      @dblclick.stop
      @keydown.esc.stop="close"
    >
      <template v-if="chrome === 'toolbar'">
        <div
          :class="
            $slots.attached
              ? 'viewport-glass pointer-events-auto flex shrink-0 items-center gap-1 rounded-2xl border px-2 py-1.5 shadow-glass-xl'
              : 'contents'
          "
        >
          <span :id="titleId" class="sr-only">{{ title }}</span>
          <IconButton
            icon="drag_indicator"
            size="xs"
            variant="ghost"
            class="viewport-action shrink-0 touch-none"
            :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
            :aria-label="`Déplacer ${title}`"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            @pointerdown="beginDrag"
            @pointermove="moveDrag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @keydown="nudge"
          />
          <slot />
        </div>
        <div v-if="$slots.attached" class="pointer-events-auto">
          <slot name="attached" />
        </div>
      </template>

      <template v-else>
        <header class="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/15 px-3 py-2.5">
          <IconButton
            icon="drag_indicator"
            size="sm"
            variant="ghost"
            class="viewport-action shrink-0 touch-none text-white/60"
            :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
            :aria-label="`Déplacer le panneau ${title}`"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            @pointerdown="beginDrag"
            @pointermove="moveDrag"
            @pointerup="endDrag"
            @pointercancel="endDrag"
            @keydown="nudge"
          />
          <slot name="icon" />
          <div class="min-w-0 flex-1">
            <Heading :id="titleId" as="h3" variant="sm" class="text-xs font-semibold text-white">
              {{ title }}
            </Heading>
            <p v-if="subtitle" class="truncate text-[10px] text-white/55">{{ subtitle }}</p>
          </div>
          <slot name="actions" />
          <IconButton
            icon="close"
            size="sm"
            variant="ghost"
            class="viewport-action shrink-0 text-white/60"
            :aria-label="`Fermer le panneau ${title}`"
            @click="close"
          />
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="shrink-0 border-t border-white/10">
          <slot name="footer" />
        </footer>
      </template>
    </section>
  </Teleport>
</template>
