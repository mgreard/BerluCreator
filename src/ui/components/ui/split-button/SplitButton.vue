<script setup lang="ts">
import { computed } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuArrow
} from 'reka-ui'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { SplitButtonProps, SplitButtonEmits, SplitButtonItem } from './types'

const splitButtonVariants = cva(
  'inline-flex items-stretch select-none transition-all duration-150 outline-none shadow-glass-sm',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-text-inverse font-bold shadow-glass-sm',
        secondary: 'bg-bg-elevated text-text-primary border border-border-default shadow-glass-sm',
        ghost: 'bg-transparent text-text-secondary border border-border-subtle',
        destructive: 'bg-danger-bg text-danger border border-danger/30',
        accent: 'bg-accent text-violet-950 font-bold shadow-glass-sm'
      },
      shape: {
        pill: 'rounded-full',
        rounded: 'rounded-xl'
      }
    },
    defaultVariants: {
      variant: 'primary',
      shape: 'rounded'
    }
  }
)

const {
  label = undefined,
  items = [],
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  disabled = false,
  loading = false,
  loadingText = undefined,
  menuAriaLabel = 'Options supplémentaires',
  class: className = undefined
} = defineProps<SplitButtonProps>()

const emit = defineEmits<SplitButtonEmits>()

// Classes pour le conteneur principal
const containerClasses = computed(() => {
  return cn(
    splitButtonVariants({ variant, shape }),
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none shadow-none',
    loading && 'opacity-80 cursor-wait pointer-events-none',
    className
  )
})

// Classes pour le bouton d'action principal
const mainButtonClasses = computed(() => {
  return cn(
    'relative inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 outline-none cursor-pointer select-none active:scale-[0.99]',
    shape === 'pill' ? 'rounded-l-full' : 'rounded-l-xl',
    size === 'sm' &&
      "min-h-[36px] px-3.5 py-1 text-xs after:content-[''] after:absolute after:-inset-1 after:min-h-[44px] after:pointer-events-auto touch-manipulation",
    size === 'md' && 'min-h-[44px] px-4 py-2 text-sm touch-manipulation',
    size === 'lg' && 'min-h-[48px] px-5 py-3 text-base touch-manipulation',

    // Effets de survol par variante
    variant === 'primary' && 'hover:bg-primary-hover active:bg-primary-active',
    variant === 'secondary' && 'hover:bg-bg-surface-hover active:bg-bg-surface-active',
    variant === 'ghost' &&
      'hover:bg-bg-surface-hover hover:text-text-primary active:bg-bg-surface-active',
    variant === 'destructive' && 'hover:bg-danger/25 active:bg-danger-bg',
    variant === 'accent' && 'hover:brightness-110 active:brightness-95',

    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary z-10'
  )
})

// Classes pour le séparateur permanent
const dividerClasses = computed(() => {
  return cn(
    'w-[1px] self-stretch transition-colors shrink-0',
    variant === 'primary' && 'bg-text-inverse/25',
    variant === 'secondary' && 'bg-border-default',
    variant === 'ghost' && 'bg-border-subtle',
    variant === 'destructive' && 'bg-danger/30',
    variant === 'accent' && 'bg-violet-950/25'
  )
})

// Classes pour le déclencheur de menu fléché
const triggerClasses = computed(() => {
  return cn(
    'relative inline-flex items-center justify-center transition-all duration-150 outline-none cursor-pointer select-none active:scale-[0.99]',
    shape === 'pill' ? 'rounded-r-full' : 'rounded-r-xl',
    size === 'sm' &&
      "w-9 min-h-[36px] text-xs px-1 after:content-[''] after:absolute after:-inset-1 after:min-w-[44px] after:min-h-[44px] after:pointer-events-auto touch-manipulation",
    size === 'md' && 'w-11 min-h-[44px] text-sm px-2 touch-manipulation',
    size === 'lg' && 'w-12 min-h-[48px] text-base px-2.5 touch-manipulation',

    // Effets de survol
    variant === 'primary' && 'hover:bg-primary-hover active:bg-primary-active',
    variant === 'secondary' && 'hover:bg-bg-surface-hover active:bg-bg-surface-active',
    variant === 'ghost' &&
      'hover:bg-bg-surface-hover hover:text-text-primary active:bg-bg-surface-active',
    variant === 'destructive' && 'hover:bg-danger/25 active:bg-danger-bg',
    variant === 'accent' && 'hover:brightness-110 active:brightness-95',

    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary z-10'
  )
})

function handleMainClick(event: MouseEvent) {
  if (disabled || loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

function handleSelect(item: SplitButtonItem) {
  if (item.disabled) return
  emit('select', item)
}
</script>

<template>
  <div :class="containerClasses">
    <!-- Action principale -->
    <button
      type="button"
      :disabled="disabled || loading"
      :aria-disabled="disabled || loading"
      :class="mainButtonClasses"
      @click="handleMainClick"
    >
      <span
        v-if="loading"
        :class="
          cn(
            'border-2 border-current border-r-transparent rounded-full animate-spin shrink-0',
            loadingText ? 'w-3.5 h-3.5' : 'absolute w-4 h-4'
          )
        "
        aria-hidden="true"
      />
      <span
        v-if="loading && loadingText"
        class="inline-flex items-center gap-2 text-inherit truncate"
      >
        {{ loadingText }}
      </span>
      <span
        v-else
        class="inline-flex items-center gap-2"
        :class="{ 'opacity-0': loading && !loadingText }"
      >
        <slot>{{ label }}</slot>
      </span>
    </button>

    <!-- Séparateur visible continu -->
    <div :class="dividerClasses" aria-hidden="true" />

    <!-- Menu Déroulant Reka UI -->
    <DropdownMenuRoot>
      <DropdownMenuTrigger
        :disabled="disabled || loading || items.length === 0"
        :aria-label="menuAriaLabel"
        :class="triggerClasses"
      >
        <svg
          class="w-3.5 h-3.5 transition-transform duration-200"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          class="min-w-[190px] max-w-[280px] p-1.5 rounded-[var(--radius-md,12px)] bg-bg-elevated border border-border-default shadow-glass-lg z-50 animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 duration-300 ease-out focus:outline-none"
          data-surface="solid"
          :side-offset="6"
          align="end"
        >
          <div class="flex flex-col gap-0.5">
            <DropdownMenuItem
              v-for="item in items"
              :key="String(item.key)"
              :disabled="item.disabled"
              :class="
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-sm,8px)] text-xs font-semibold select-none cursor-pointer outline-none transition-colors duration-300 ease-out',
                  'hover:bg-bg-surface-hover hover:text-text-primary focus:bg-bg-surface-hover focus:text-text-primary',
                  item.destructive &&
                    'text-danger hover:bg-danger-bg hover:text-danger focus:bg-danger-bg focus:text-danger',
                  !item.destructive && 'text-text-primary',
                  item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
                )
              "
              @select="handleSelect(item)"
            >
              <Icon v-if="item.icon" :name="item.icon" size="sm" class="shrink-0" />
              <span class="flex-1 truncate">{{ item.label }}</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuArrow
            class="fill-bg-elevated border-border-default"
            :width="10"
            :height="5"
          />
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </div>
</template>
