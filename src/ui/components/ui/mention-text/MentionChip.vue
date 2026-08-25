<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { MentionChipProps, MentionChipEmits } from './types'

const chipVariants = cva(
  'inline-flex select-none transition-colors duration-150 cursor-pointer align-baseline outline-none',
  {
    variants: {
      variant: {
        text: 'items-baseline font-semibold hover:underline focus-visible:underline focus-visible:ring-1 focus-visible:ring-primary rounded-xs',
        pill: 'items-center my-0.5 rounded-md font-semibold border backdrop-blur-md hover:scale-[1.02] active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg-base'
      },
      color: {
        purple: '',
        amber: '',
        emerald: '',
        sky: '',
        rose: '',
        indigo: '',
        neutral: ''
      },
      size: {
        sm: '',
        md: ''
      }
    },
    compoundVariants: [
      // Text variant sizes & colors
      { variant: 'text', size: 'sm', class: 'text-xs gap-0.5' },
      { variant: 'text', size: 'md', class: 'text-sm gap-1' },
      {
        variant: 'text',
        color: 'purple',
        class:
          'text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200'
      },
      {
        variant: 'text',
        color: 'amber',
        class: 'text-amber-600 dark:text-amber-300 hover:text-amber-700 dark:hover:text-amber-200'
      },
      {
        variant: 'text',
        color: 'emerald',
        class:
          'text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200'
      },
      {
        variant: 'text',
        color: 'sky',
        class: 'text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200'
      },
      {
        variant: 'text',
        color: 'rose',
        class: 'text-rose-600 dark:text-rose-300 hover:text-rose-700 dark:hover:text-rose-200'
      },
      {
        variant: 'text',
        color: 'indigo',
        class:
          'text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-200'
      },
      { variant: 'text', color: 'neutral', class: 'text-text-primary hover:text-primary' },

      // Pill variant sizes & colors
      { variant: 'pill', size: 'sm', class: 'text-[11px] py-0 px-1.5 gap-0.5' },
      { variant: 'pill', size: 'md', class: 'text-xs py-0.5 px-1.5 gap-1' },
      {
        variant: 'pill',
        color: 'purple',
        class:
          'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/50 focus-visible:ring-purple-400'
      },
      {
        variant: 'pill',
        color: 'amber',
        class:
          'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25 hover:border-amber-500/50 focus-visible:ring-amber-400'
      },
      {
        variant: 'pill',
        color: 'emerald',
        class:
          'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50 focus-visible:ring-emerald-400'
      },
      {
        variant: 'pill',
        color: 'sky',
        class:
          'bg-sky-500/15 text-sky-300 border-sky-500/30 hover:bg-sky-500/25 hover:border-sky-500/50 focus-visible:ring-sky-400'
      },
      {
        variant: 'pill',
        color: 'rose',
        class:
          'bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25 hover:border-rose-500/50 focus-visible:ring-rose-400'
      },
      {
        variant: 'pill',
        color: 'indigo',
        class:
          'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25 hover:border-indigo-500/50 focus-visible:ring-indigo-400'
      },
      {
        variant: 'pill',
        color: 'neutral',
        class:
          'bg-bg-surface text-text-primary border-border-default hover:bg-bg-surface-hover focus-visible:ring-primary'
      }
    ],
    defaultVariants: {
      variant: 'text',
      color: 'neutral',
      size: 'md'
    }
  }
)

const {
  variant = 'text',
  id = undefined,
  label,
  category = undefined,
  color = 'neutral',
  icon = undefined,
  size = 'md',
  interactive = true,
  class: className = undefined,
  style: styleValue = undefined
} = defineProps<MentionChipProps>()

const emit = defineEmits<MentionChipEmits>()

const formattedLabel = computed(() => {
  return label.startsWith('@') ? label : `@${label}`
})

function handleClick(event: MouseEvent) {
  if (!interactive) return
  emit('click', { id, label, category, event })
}

function handleKeyDown(event: KeyboardEvent) {
  if (!interactive) return
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', { id, label, category, event: event as unknown as MouseEvent })
  }
}
</script>

<template>
  <span
    :class="
      cn(
        chipVariants({ variant, color, size }),
        !interactive && 'pointer-events-none hover:no-underline cursor-default',
        className
      )
    "
    :role="interactive ? 'button' : undefined"
    :style="styleValue"
    :tabindex="interactive ? 0 : undefined"
    :aria-label="`Mention ${label}`"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <Icon
      v-if="icon"
      :name="icon"
      size="xs"
      class="shrink-0 opacity-90 leading-none self-center inline-block align-middle"
    />
    <span class="leading-normal">{{ formattedLabel }}</span>
  </span>
</template>
