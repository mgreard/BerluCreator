<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import type { ButtonGroupProps } from './types'

const {
  orientation = 'horizontal',
  attached = true,
  shape = 'rounded',
  disabled = false,
  ariaLabel = 'Groupe de boutons',
  class: className = undefined
} = defineProps<ButtonGroupProps>()

const groupClasses = computed(() => {
  return cn(
    'inline-flex select-none',
    orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col items-stretch',
    attached
      ? [
          orientation === 'horizontal'
            ? [
                '[&>*:not(:first-child):not(:last-child)]:rounded-none',
                shape === 'pill'
                  ? '[&>*:first-child:not(:last-child)]:rounded-l-full [&>*:first-child:not(:last-child)]:rounded-r-none [&>*:last-child:not(:first-child)]:rounded-r-full [&>*:last-child:not(:first-child)]:rounded-l-none'
                  : '[&>*:first-child:not(:last-child)]:rounded-l-xl [&>*:first-child:not(:last-child)]:rounded-r-none [&>*:last-child:not(:first-child)]:rounded-r-xl [&>*:last-child:not(:first-child)]:rounded-l-none',
                '[&>*:not(:first-child)]:-ml-px'
              ]
            : [
                '[&>*:not(:first-child):not(:last-child)]:rounded-none',
                shape === 'pill'
                  ? '[&>*:first-child:not(:last-child)]:rounded-t-full [&>*:first-child:not(:last-child)]:rounded-b-none [&>*:last-child:not(:first-child)]:rounded-b-full [&>*:last-child:not(:first-child)]:rounded-t-none'
                  : '[&>*:first-child:not(:last-child)]:rounded-t-xl [&>*:first-child:not(:last-child)]:rounded-b-none [&>*:last-child:not(:first-child)]:rounded-b-xl [&>*:last-child:not(:first-child)]:rounded-t-none',
                '[&>*:not(:first-child)]:-mt-px'
              ],
          '[&>*]:relative [&>*:hover]:z-10 [&>*:focus-visible]:z-20'
        ]
      : 'gap-1.5',
    disabled && 'opacity-50 pointer-events-none cursor-not-allowed',
    className
  )
})
</script>

<template>
  <div
    role="group"
    :aria-label="ariaLabel"
    :class="groupClasses"
  >
    <slot />
  </div>
</template>
