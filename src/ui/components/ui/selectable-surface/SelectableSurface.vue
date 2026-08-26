<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { SelectableSurfaceEmits, SelectableSurfaceProps } from './types'

defineOptions({ inheritAttrs: false })

const {
  as = 'div',
  selected = false,
  disabled = false,
  role = 'option',
  density = 'default',
  class: className = undefined
} = defineProps<SelectableSurfaceProps>()

const emit = defineEmits<SelectableSurfaceEmits>()
const attrs = useAttrs()
const generatedId = useId()

const isNativeInteractive = computed(
  () => typeof as === 'string' && ['button', 'a', 'input', 'select', 'textarea'].includes(as)
)

const classes = computed(() =>
  cn(
    'relative min-w-0 outline-none touch-manipulation transition-colors',
    'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
    density === 'default' && 'min-h-[44px]',
    density === 'compact' &&
      "min-h-[32px] after:content-[''] after:absolute after:-inset-y-1.5 after:inset-x-0 after:min-h-[44px] after:pointer-events-none",
    disabled && 'pointer-events-none cursor-not-allowed opacity-50',
    className
  )
)

function handleClick(event: MouseEvent) {
  if (disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}

function handleKeydown(event: KeyboardEvent) {
  if (disabled || isNativeInteractive.value || event.target !== event.currentTarget) return
  if (event.key !== 'Enter' && event.key !== ' ') return

  event.preventDefault()
  emit('click', event)
}
</script>

<template>
  <Primitive
    v-bind="attrs"
    :id="String(attrs.id ?? generatedId)"
    :as="as"
    :type="as === 'button' ? 'button' : undefined"
    :role="isNativeInteractive ? undefined : role"
    :tabindex="disabled ? -1 : isNativeInteractive ? undefined : 0"
    :aria-selected="role === 'option' || role === 'treeitem' ? selected : undefined"
    :aria-pressed="role === 'button' ? selected : undefined"
    :aria-checked="role === 'radio' ? selected : undefined"
    :aria-disabled="disabled"
    :disabled="as === 'button' ? disabled : undefined"
    :class="classes"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <slot />
  </Primitive>
</template>
