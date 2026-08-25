<script setup lang="ts">
import { computed, useAttrs, useSlots, useId } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { InputProps, InputEmits } from './types'
import { inputContainerVariants } from './variants'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number>({ default: '' })

const {
  type = 'text',
  placeholder = '',
  size = 'md',
  disabled = false,
  readonly = false,
  id = undefined,
  name = undefined,
  error = false,
  class: className = undefined
} = defineProps<InputProps>()

const emit = defineEmits<InputEmits>()
const attrs = useAttrs()

const autoId = useId()
const inputId = computed(() => id || autoId)

const hasError = computed(() => Boolean(error))

const inputAttrs = computed(() => ({
  ...attrs,
  ...(hasError.value ? { 'aria-invalid': true } : {})
}))

const slots = useSlots()
const hasPrefix = computed(() => !!slots.prefix)
const hasSuffix = computed(() => !!slots.suffix)

const containerClasses = computed(() => {
  return cn(
    inputContainerVariants({
      size,
      hasError: hasError.value,
      disabled
    }),
    className
  )
})

const inputClasses = computed(() => {
  return cn(
    'flex-1 w-full min-w-0 bg-transparent border-none outline-none appearance-none ring-0 shadow-none text-inherit font-sans placeholder:text-text-muted [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden',
    size === 'sm' && 'py-1 px-2.5 text-xs',
    size === 'md' && 'py-2 px-3.5 text-sm',
    size === 'lg' && 'py-3 px-4 text-base',
    hasPrefix.value && 'pl-2',
    hasSuffix.value && 'pr-2',
    disabled && 'cursor-not-allowed'
  )
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  if (type === 'number') {
    model.value =
      target.value === '' || Number.isNaN(target.valueAsNumber) ? '' : target.valueAsNumber
  } else {
    model.value = target.value
  }
}
</script>

<template>
  <div :class="containerClasses">
    <span
      v-if="hasPrefix"
      class="flex items-center justify-center text-text-muted pl-3 select-none shrink-0"
      aria-hidden="true"
    >
      <slot name="prefix" />
    </span>

    <input
      v-bind="inputAttrs"
      :id="inputId"
      :name="name"
      :type="type"
      :value="model"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :class="inputClasses"
      style="border: none !important; outline: none !important; box-shadow: none !important; background: transparent !important;"
      @input="handleInput"
      @change="emit('change', $event)"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
    />

    <span
      v-if="hasSuffix"
      class="flex items-center justify-center text-text-muted pr-3 select-none shrink-0"
      aria-hidden="true"
    >
      <slot name="suffix" />
    </span>
  </div>
</template>
