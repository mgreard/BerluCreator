<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  type AcceptableValue
} from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { SelectProps, SelectEmits } from './types'

defineOptions({ inheritAttrs: false })

const model = defineModel<string | number | boolean | null>()

const {
  options = [],
  placeholder = 'Sélectionner...',
  size = 'md',
  disabled = false,
  id = undefined,
  name = undefined,
  error = false,
  contentZIndex = 1300,
  class: className = undefined
} = defineProps<SelectProps>()

const emit = defineEmits<SelectEmits>()
const attrs = useAttrs()

const optionEntries = computed(() =>
  options.map((option, index) => ({
    option,
    internalValue: `mcl-select-option-${index}`
  }))
)

const selectedOption = computed(() =>
  options.find((option) => Object.is(option.value, model.value))
)

const selectedOptionLabel = computed(() => {
  return selectedOption.value?.label
})

const internalModelValue = computed(() => {
  const selectedIndex = options.findIndex((option) => Object.is(option.value, model.value))
  return selectedIndex >= 0 ? optionEntries.value[selectedIndex]?.internalValue : undefined
})

const formValue = computed(() =>
  model.value === null || model.value === undefined ? '' : String(model.value)
)

const triggerAriaLabel = computed(
  () => (attrs['aria-label'] as string | undefined) ?? selectedOptionLabel.value ?? placeholder
)

const triggerClasses = computed(() => {
  return cn(
    'relative inline-flex items-center justify-between w-full bg-bg-elevated hover:bg-bg-surface-hover border border-border-default hover:border-border-hover rounded-[var(--radius-md,12px)] transition-all duration-300 ease-out text-text-primary outline-none select-none cursor-pointer shadow-glass-xs',
    'focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-primary/15',
    size === 'sm' && 'min-h-[36px] py-1.5 px-3 text-xs',
    size === 'md' && 'min-h-[44px] py-2 px-3.5 text-sm touch-manipulation',
    size === 'lg' && 'min-h-[48px] py-3 px-4 text-base touch-manipulation',
    error && 'border-danger focus-visible:border-danger focus-visible:ring-danger/20',
    disabled && 'opacity-50 cursor-not-allowed bg-bg-surface/30 pointer-events-none',
    className
  )
})

function handleValueChange(val: AcceptableValue) {
  if (val === null || val === undefined) {
    model.value = null
    emit('change', null)
    return
  }
  const strVal = String(val)
  const entry = optionEntries.value.find((optionEntry) => optionEntry.internalValue === strVal)
  const actualVal = entry ? entry.option.value : (val as string | number | boolean | null)
  model.value = actualVal
  emit('change', actualVal)
}
</script>

<template>
  <SelectRoot
    :model-value="internalModelValue"
    :disabled="disabled"
    @update:model-value="handleValueChange"
  >
    <SelectTrigger
      v-bind="attrs"
      :id="id"
      :aria-label="triggerAriaLabel"
      :aria-invalid="Boolean(error) ? 'true' : undefined"
      :class="triggerClasses"
    >
      <SelectValue :placeholder="placeholder">
        {{ selectedOptionLabel ?? placeholder }}
      </SelectValue>
      <Icon
        name="expand_more"
        size="xs"
        class="text-text-muted ml-2 pointer-events-none shrink-0"
        aria-hidden="true"
      />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-md,12px)] border border-border-default bg-bg-elevated shadow-glass-lg text-text-primary animate-in fade-in-80 duration-300 ease-out"
        data-surface="solid"
        :style="{ zIndex: contentZIndex }"
        position="popper"
        :side-offset="4"
      >
        <SelectViewport class="p-1 max-h-60 overflow-y-auto">
          <template v-if="options && options.length > 0">
            <SelectItem
              v-for="entry in optionEntries"
              :key="entry.internalValue"
              :value="entry.internalValue"
              :disabled="entry.option.disabled"
              class="relative flex items-center justify-between w-full min-h-[36px] py-1.5 px-3 rounded-lg text-sm select-none cursor-pointer outline-none transition-colors data-[highlighted]:bg-bg-surface-hover data-[highlighted]:text-text-primary data-[disabled]:opacity-40 data-[disabled]:pointer-events-none text-text-primary"
            >
              <SelectItemText>{{ entry.option.label }}</SelectItemText>
              <SelectItemIndicator class="text-primary text-xs ml-2 font-bold">
                <Icon name="check" size="xs" />
              </SelectItemIndicator>
            </SelectItem>
          </template>
          <slot v-else />
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
  <input v-if="name" type="hidden" :name="name" :value="formValue" :disabled="disabled" />
</template>
