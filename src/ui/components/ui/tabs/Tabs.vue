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
import type { TabsProps, TabsEmits, TabItem } from './types'

const model = defineModel<string | number>()

const {
  tabs = [],
  variant = 'capsule',
  activationMode = 'automatic',
  size = 'md',
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
  [() => model.value, () => tabs, () => variant],
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
    'relative flex items-center select-none box-border outline-none overflow-x-auto scrollbar-none',
    variant === 'capsule' &&
      'bg-bg-surface/60 border border-border-default p-1 rounded-full gap-1 backdrop-blur-md',
    variant === 'segmented' &&
      'w-full bg-bg-surface/60 border border-border-default p-1 rounded-2xl gap-1 backdrop-blur-md',
    variant === 'underline' && 'border-b border-border-default gap-6',
    className
  )
})

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
  return cn(
    'relative z-10 inline-flex items-center justify-center font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 outline-none select-none',
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

    tab.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
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
    as="div"
    class="w-full flex flex-col"
    @update:model-value="handleValueChange"
  >
    <TabsList :ref="setTabsListRef" :class="navClasses">
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
        <span class="truncate">{{ tab.label }}</span>
        <span
          v-if="tab.badge !== undefined"
          :class="
            cn(
              'text-[0.68rem] font-bold px-1.5 py-0.2 rounded-full shrink-0 transition-colors',
              variant === 'capsule' && String(model) === String(tab.key)
                ? 'bg-text-inverse/20 text-inherit'
                : 'bg-bg-surface-hover text-text-secondary border border-border-subtle'
            )
          "
        >
          {{ tab.badge }}
        </span>
      </TabsTrigger>
    </TabsList>

    <!-- Panneaux de contenu avec sémantique WAI-ARIA role="tabpanel" (uniquement si du contenu ou slot est fourni) -->
    <div v-if="hasTabContent || $slots.default" class="mt-3">
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
