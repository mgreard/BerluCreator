<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { TextareaProps, TextareaEmits } from './types'
import { textareaContainerVariants } from './variants'

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ default: '' })

const {
  placeholder = '',
  rows = 4,
  size = 'md',
  disabled = false,
  readonly = false,
  monospace = false,
  id = undefined,
  name = undefined,
  error = false,
  class: className = undefined
} = defineProps<TextareaProps>()

const emit = defineEmits<TextareaEmits>()
const attrs = useAttrs()

const autoId = useId()
const textareaId = computed(() => id || autoId)
const hasError = computed(() => Boolean(error))

const textareaAttrs = computed(() => ({
  ...attrs,
  ...(hasError.value ? { 'aria-invalid': true } : {})
}))

const containerClasses = computed(() => {
  return cn(
    textareaContainerVariants({
      hasError: hasError.value,
      disabled
    }),
    className
  )
})

const textareaClasses = computed(() => {
  return cn(
    'w-full min-w-0 bg-transparent border-none outline-none appearance-none ring-0 shadow-none text-inherit resize-y leading-relaxed placeholder:text-text-muted',
    monospace ? 'font-mono text-xs sm:text-sm' : 'font-sans',
    size === 'sm' && 'p-2.5 text-xs',
    size === 'md' && 'p-3.5 text-sm',
    size === 'lg' && 'p-4 text-base',
    disabled && 'cursor-not-allowed'
  )
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  model.value = target.value
}
</script>

<template>
  <div :class="containerClasses">
    <textarea
      v-bind="textareaAttrs"
      :id="textareaId"
      :name="name"
      :rows="rows"
      :value="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :class="textareaClasses"
      style="border: none !important; outline: none !important; box-shadow: none !important; background: transparent !important;"
      @input="handleInput"
      @change="emit('change', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />
  </div>
</template>
