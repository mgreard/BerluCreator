<script setup lang="ts">
import { ref, computed } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import type { StarRatingProps, StarRatingEmits } from './types'

const model = defineModel<number | null>({ default: 0 })

const {
  maxStars = 5,
  readonly = false,
  disabled = false,
  size = 'md',
  showValue = false,
  class: className = undefined
} = defineProps<StarRatingProps>()

const emit = defineEmits<StarRatingEmits>()

const hoverRating = ref<number | null>(null)

const currentDisplayRating = computed(() => {
  if (hoverRating.value !== null && !readonly && !disabled) {
    return hoverRating.value
  }
  return model.value || 0
})

function setRating(rating: number) {
  if (readonly || disabled) return
  model.value = rating
  emit('change', rating)
}

function handleMouseEnter(rating: number) {
  if (readonly || disabled) return
  hoverRating.value = rating
}

function handleMouseLeave() {
  hoverRating.value = null
}

const containerClasses = computed(() => {
  return cn(
    'inline-flex items-center gap-2',
    disabled && 'opacity-50 pointer-events-none',
    className
  )
})

function getStarClasses(starIndex: number) {
  const isActive = currentDisplayRating.value >= starIndex
  const isInteractive = !readonly && !disabled

  return cn(
    'bg-transparent border-0 p-0 line-none leading-none select-none transition-all duration-150 touch-manipulation inline-flex items-center justify-center',
    isInteractive ? 'cursor-pointer hover:scale-120' : 'cursor-default',
    isActive
      ? 'text-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]'
      : 'text-border-default hover:text-warning/60'
  )
}
</script>

<template>
  <div :class="containerClasses" @mouseleave="handleMouseLeave">
    <div
      class="inline-flex items-center gap-0.5"
      role="radiogroup"
      :aria-label="`Note ${model} sur ${maxStars}`"
    >
      <button
        v-for="s in maxStars"
        :key="s"
        type="button"
        role="radio"
        :class="getStarClasses(s)"
        :disabled="readonly || disabled"
        :aria-checked="currentDisplayRating >= s"
        :aria-label="`${s} étoiles sur ${maxStars}`"
        @click="setRating(s)"
        @mouseenter="handleMouseEnter(s)"
      >
        <Icon
          name="star"
          :filled="currentDisplayRating >= s"
          :size="size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'"
        />
      </button>
    </div>

    <span v-if="showValue" class="text-xs font-semibold text-text-muted ml-1">
      {{ model }} / {{ maxStars }}
    </span>
  </div>
</template>
