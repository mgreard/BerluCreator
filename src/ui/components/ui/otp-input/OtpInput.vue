<script setup lang="ts">
import { computed } from 'vue'
import { PinInputRoot, PinInputInput } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { OtpInputProps, OtpInputEmits } from './types'
import { otpSlotVariants } from './variants'

const modelValue = defineModel<string[] | string>({ default: '' })

const {
  length = 6,
  type = 'number',
  mask = false,
  placeholder = '○',
  disabled = false,
  separator = false,
  variant = 'default',
  size = 'md',
  autoFocus = false,
  ariaLabel = 'Code de vérification',
  class: className = undefined
} = defineProps<OtpInputProps>()

const emit = defineEmits<OtpInputEmits>()

// Normalisation du modelValue sous forme de tableau de chaînes pour PinInputRoot
const internalValues = computed<string[]>({
  get() {
    if (Array.isArray(modelValue.value)) {
      return modelValue.value
    }
    if (typeof modelValue.value === 'string') {
      return modelValue.value.split('')
    }
    return []
  },
  set(newVals: string[]) {
    if (Array.isArray(modelValue.value)) {
      modelValue.value = newVals
    } else {
      modelValue.value = newVals.join('')
    }
    const joined = newVals.join('')
    emit('change', joined)
    if (joined.length === length && newVals.every((v) => v !== '')) {
      emit('complete', joined)
    }
  }
})

const separatorIndex = computed(() => {
  if (!separator) return -1
  return Math.floor(length / 2)
})

const separatorChar = computed(() => {
  if (typeof separator === 'string') return separator
  return '—'
})
</script>

<template>
  <div :class="cn('inline-flex flex-col gap-2 select-none', className)">
    <PinInputRoot
      v-model="internalValues"
      :type="type === 'number' ? 'number' : 'text'"
      :mask="mask"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autoFocus"
      role="group"
      :aria-label="ariaLabel"
      class="flex items-center gap-2 flex-wrap"
      @complete="(val) => emit('complete', Array.isArray(val) ? val.join('') : String(val))"
    >
      <template v-for="index in length" :key="index - 1">
        <!-- Séparateur central optionnel -->
        <span
          v-if="separator && index - 1 === separatorIndex"
          class="text-text-muted text-sm font-bold select-none px-1"
          aria-hidden="true"
        >
          {{ separatorChar }}
        </span>

        <!-- Case de saisie OTP individuelle -->
        <PinInputInput :index="index - 1" :class="cn(otpSlotVariants({ size, variant }))" />
      </template>
    </PinInputRoot>
  </div>
</template>
