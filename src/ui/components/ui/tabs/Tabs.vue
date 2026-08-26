<script setup lang="ts">
import {
  ref,
  shallowRef,
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  watch,
  type ComponentPublicInstance
} from 'vue'
import { TabsRoot, TabsList, TabsTrigger, TabsContent, type AcceptableValue } from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { TabsProps, TabsEmits, TabItem, TabTone } from './types'

const model = defineModel<string | number>()

const {
  tabs = [],
  variant = 'capsule',
  activationMode = 'automatic',
  size = 'md',
  orientation = 'horizontal',
  ariaLabel = 'Onglets',
  class: className = undefined
} = defineProps<TabsProps>()

const emit = defineEmits<TabsEmits>()

// Référence au conteneur de liste pour mesurer l'indicateur glissant
const tabsListElement = shallowRef<HTMLElement | null>(null)

function setTabsListRef(value: Element | ComponentPublicInstance | null) {
  if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
    tabsListElement.value = value
    return
  }

  tabsListElement.value =
    value && '$el' in value && value.$el instanceof HTMLElement ? value.$el : null
}

const indicatorStyle = ref<{
  left: string
  top?: string
  width: string
  height?: string
  opacity: number
}>({
  left: '0px',
  width: '0px',
  opacity: 0
})

function getListElement(): HTMLElement | null {
  return tabsListElement.value
}

function updateIndicator() {
  const el = getListElement()
  if (!el) return

  const activeEl = el.querySelector<HTMLElement>('[data-state="active"]')
  if (activeEl) {
    const parentRect = el.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()

    const left = activeRect.left - parentRect.left + el.scrollLeft
    const width = activeRect.width
    const top = activeRect.top - parentRect.top
    const height = activeRect.height

    indicatorStyle.value = {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      opacity: 1
    }
  } else {
    indicatorStyle.value = { ...indicatorStyle.value, opacity: 0 }
  }
}

watch(
  [() => model.value, () => tabs, () => variant, () => orientation],
  () => {
    nextTick(() => {
      updateIndicator()
    })
  },
  { deep: true }
)

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    updateIndicator()

    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      const el = getListElement()
      if (el) {
        resizeObserver = new ResizeObserver(() => {
          updateIndicator()
        })
        resizeObserver.observe(el)
      }
    }
  })
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

const hasTabContent = computed(() => tabs.some((t) => !!t.content))

const navClasses = computed(() => {
  return cn(
    'relative flex items-center select-none box-border outline-none scrollbar-none',
    orientation === 'horizontal' && 'overflow-x-auto',
    orientation === 'vertical' && 'overflow-y-auto overflow-x-hidden',
    variant === 'capsule' &&
      'bg-bg-surface/60 border border-border-default p-1 rounded-full gap-1 backdrop-blur-md',
    variant === 'segmented' &&
      'w-full bg-bg-surface/60 border border-border-default p-1 rounded-2xl gap-1 backdrop-blur-md',
    variant === 'underline' && 'border-b border-border-default gap-6',
    variant === 'rail' &&
      'h-full w-16 flex-col gap-2 border-r border-border-subtle bg-bg-surface/30 px-2 py-3 backdrop-blur-md',
    className
  )
})

const rootClasses = computed(() =>
  cn(
    'flex',
    orientation === 'horizontal' && 'w-full flex-col',
    orientation === 'vertical' && 'h-full w-auto flex-row'
  )
)

const contentClasses = computed(() =>
  cn(
    orientation === 'horizontal' && 'mt-3',
    orientation === 'vertical' && 'ml-3 flex-1 min-w-0'
  )
)

const railToneClasses: Record<TabTone, { idle: string; active: string; badge: string }> = {
  neutral: {
    idle: 'text-slate-400/75 hover:text-slate-200 hover:bg-slate-400/10',
    active: 'text-slate-100 bg-slate-400/15 border-slate-300/50 ring-slate-300/25',
    badge: 'bg-slate-200 text-slate-950 border-slate-100/70'
  },
  indigo: {
    idle: 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10',
    active: 'text-indigo-200 bg-indigo-500/15 border-indigo-400/55 ring-indigo-400/25',
    badge: 'bg-indigo-300 text-indigo-950 border-indigo-100/70'
  },
  sky: {
    idle: 'text-sky-400/70 hover:text-sky-300 hover:bg-sky-500/10',
    active: 'text-sky-200 bg-sky-500/15 border-sky-400/55 ring-sky-400/25',
    badge: 'bg-sky-300 text-sky-950 border-sky-100/70'
  },
  amber: {
    idle: 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10',
    active: 'text-amber-200 bg-amber-500/15 border-amber-400/55 ring-amber-400/25',
    badge: 'bg-amber-300 text-amber-950 border-amber-100/70'
  },
  rose: {
    idle: 'text-rose-400/70 hover:text-rose-300 hover:bg-rose-500/10',
    active: 'text-rose-200 bg-rose-500/15 border-rose-400/55 ring-rose-400/25',
    badge: 'bg-rose-300 text-rose-950 border-rose-100/70'
  },
  red: {
    idle: 'text-red-400/70 hover:text-red-300 hover:bg-red-500/10',
    active: 'text-red-200 bg-red-500/15 border-red-400/55 ring-red-400/25',
    badge: 'bg-red-300 text-red-950 border-red-100/70'
  },
  cyan: {
    idle: 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10',
    active: 'text-cyan-200 bg-cyan-500/15 border-cyan-400/55 ring-cyan-400/25',
    badge: 'bg-cyan-300 text-cyan-950 border-cyan-100/70'
  },
  emerald: {
    idle: 'text-emerald-400/70 hover:text-emerald-300 hover:bg-emerald-500/10',
    active: 'text-emerald-200 bg-emerald-500/15 border-emerald-400/55 ring-emerald-400/25',
    badge: 'bg-emerald-300 text-emerald-950 border-emerald-100/70'
  },
  lime: {
    idle: 'text-lime-400/70 hover:text-lime-300 hover:bg-lime-500/10',
    active: 'text-lime-200 bg-lime-500/15 border-lime-400/55 ring-lime-400/25',
    badge: 'bg-lime-300 text-lime-950 border-lime-100/70'
  },
  purple: {
    idle: 'text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10',
    active: 'text-purple-200 bg-purple-500/15 border-purple-400/55 ring-purple-400/25',
    badge: 'bg-purple-300 text-purple-950 border-purple-100/70'
  },
  yellow: {
    idle: 'text-yellow-400/70 hover:text-yellow-300 hover:bg-yellow-500/10',
    active: 'text-yellow-200 bg-yellow-500/15 border-yellow-400/55 ring-yellow-400/25',
    badge: 'bg-yellow-300 text-yellow-950 border-yellow-100/70'
  }
}

function handleValueChange(val: AcceptableValue) {
  if (val === null || val === undefined) return
  const strVal = String(val)
  const tab = tabs.find((t) => String(t.key) === strVal)
  const actualKey = tab ? tab.key : (val as string | number)
  model.value = actualKey
  emit('change', actualKey)
  nextTick(() => {
    updateIndicator()
  })
}

function getTabTriggerClasses(tab: TabItem) {
  const isSelected = String(model.value) === String(tab.key)
  const tone = railToneClasses[tab.tone ?? 'neutral']
  return cn(
    'relative z-10 inline-flex items-center justify-center font-semibold whitespace-nowrap cursor-pointer transition-all duration-300 ease-out outline-none select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-h-[36px] touch-manipulation',

    // Variant Capsule
    variant === 'capsule' && [
      'rounded-full',
      size === 'sm' && 'px-3 py-1 text-xs gap-1.5 min-h-[32px]',
      size === 'md' && 'px-4 py-1.5 text-sm gap-2 min-h-[38px]',
      isSelected ? 'text-text-inverse font-bold' : 'text-text-secondary hover:text-text-primary'
    ],

    // Variant Segmented
    variant === 'segmented' && [
      'flex-1 min-w-0 rounded-xl',
      size === 'sm' && 'px-2 py-1 text-xs gap-1.5 min-h-[32px]',
      size === 'md' && 'px-3 py-1.5 text-sm gap-2 min-h-[38px]',
      isSelected ? 'text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary'
    ],

    // Variant Underline
    variant === 'underline' && [
      'bg-transparent border-0 text-text-secondary hover:text-text-primary pb-2.5 pt-1 -mb-[1px]',
      size === 'sm' && 'text-xs gap-1.5',
      size === 'md' && 'text-sm gap-2',
      isSelected && 'text-primary font-bold'
    ],

    // Variant Rail vertical coloré
    variant === 'rail' && [
      'w-11 h-11 min-h-[44px] shrink-0 rounded-2xl border p-0',
      'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]',
      isSelected
        ? [tone.active, 'ring-2 scale-[1.04] shadow-glass-sm']
        : [tone.idle, 'border-transparent hover:scale-[1.03]']
    ],

    tab.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
  )
}

function getTabBadgeClasses(tab: TabItem) {
  const isSelected = String(model.value) === String(tab.key)
  const tone = railToneClasses[tab.tone ?? 'neutral']

  return cn(
    'font-bold shrink-0 transition-all duration-300 ease-out border',
    variant === 'rail' &&
      'absolute top-0.5 right-0.5 min-w-4 h-4 px-1 inline-flex items-center justify-center rounded-full text-[9px] leading-none shadow-xs',
    variant !== 'rail' && 'text-[0.68rem] px-1.5 py-0.2 rounded-full',
    variant === 'rail' && isSelected
      ? tone.badge
      : variant === 'capsule' && isSelected
        ? 'bg-text-inverse/20 text-inherit border-transparent'
        : 'bg-bg-elevated/90 text-text-muted border-border-subtle'
  )
}

function isMaterialIcon(icon?: string): boolean {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
}
</script>

<template>
  <TabsRoot
    :model-value="model !== undefined && model !== null ? String(model) : undefined"
    :activation-mode="activationMode"
    :orientation="orientation"
    as="div"
    :class="rootClasses"
    @update:model-value="handleValueChange"
  >
    <TabsList :ref="setTabsListRef" :class="navClasses" :aria-label="ariaLabel">
      <!-- Indicateur Glissant Physique / Animé (Micro-interaction FSC) -->
      <span
        v-if="variant === 'capsule'"
        class="absolute z-0 bg-primary rounded-full shadow-glass-sm transition-all duration-300 ease-out pointer-events-none"
        :style="{
          left: indicatorStyle.left,
          top: indicatorStyle.top,
          width: indicatorStyle.width,
          height: indicatorStyle.height,
          opacity: indicatorStyle.opacity
        }"
        aria-hidden="true"
      />

      <span
        v-else-if="variant === 'segmented'"
        class="absolute z-0 bg-bg-surface border border-border-default rounded-xl shadow-glass-sm transition-all duration-300 ease-out pointer-events-none"
        :style="{
          left: indicatorStyle.left,
          top: indicatorStyle.top,
          width: indicatorStyle.width,
          height: indicatorStyle.height,
          opacity: indicatorStyle.opacity
        }"
        aria-hidden="true"
      />

      <span
        v-else-if="variant === 'underline'"
        class="absolute z-0 bottom-0 h-0.5 bg-primary rounded-full transition-all duration-300 ease-out pointer-events-none"
        :style="{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity
        }"
        aria-hidden="true"
      />

      <TabsTrigger
        v-for="tab in tabs"
        :key="String(tab.key)"
        :value="String(tab.key)"
        :disabled="tab.disabled"
        :class="getTabTriggerClasses(tab)"
        :title="variant === 'rail' ? `${tab.label}${tab.badge !== undefined ? ` (${tab.badge})` : ''}` : undefined"
      >
        <Icon
          v-if="tab.icon && isMaterialIcon(tab.icon)"
          :name="tab.icon"
          size="sm"
          class="shrink-0"
          aria-hidden="true"
        />
        <span v-else-if="tab.icon" class="text-sm leading-none shrink-0" aria-hidden="true">{{
          tab.icon
        }}</span>
        <span :class="variant === 'rail' ? 'sr-only' : 'truncate'">{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined"
          :class="getTabBadgeClasses(tab)"
        >
          {{ tab.badge }}
        </span>
      </TabsTrigger>
    </TabsList>

    <!-- Panneaux de contenu avec sémantique WAI-ARIA role="tabpanel" (uniquement si du contenu ou slot est fourni) -->
    <div v-if="hasTabContent || $slots.default" :class="contentClasses">
      <template v-for="tab in tabs" :key="`content-${tab.key}`">
        <TabsContent
          v-if="tab.content || $slots[`tab-${tab.key}`]"
          :value="String(tab.key)"
          class="outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl"
        >
          <slot :name="`tab-${tab.key}`" :tab="tab">
            <div v-if="tab.content" class="text-sm text-text-secondary">
              {{ tab.content }}
            </div>
          </slot>
        </TabsContent>
      </template>
      <slot />
    </div>
  </TabsRoot>
</template>
