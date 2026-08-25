<script setup lang="ts">
import { computed, getCurrentInstance, type Component } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/shared/utils/cn'
import type { ButtonProps, ButtonEmits } from './types'
import { buttonVariants } from './variants'

const {
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  active = false,
  disabled = false,
  loading = false,
  loadingText = undefined,
  type = 'button',
  to = undefined,
  href = undefined,
  as = 'button',
  asChild = false,
  class: className = undefined
} = defineProps<ButtonProps>()

const emit = defineEmits<ButtonEmits>()
const instance = getCurrentInstance()

const isLink = computed(() => !!to || !!href)

const resolvedAs = computed<ButtonProps['as']>(() => {
  if (as && as !== 'button') return as
  if (to) {
    const routerLink =
      instance?.appContext.components.RouterLink ?? instance?.appContext.components['router-link']
    return routerLink ? (routerLink as Component) : 'a'
  }
  if (href) return 'a'
  return 'button'
})

const resolvedHref = computed(() => {
  if (href) return href
  // Conserver un href natif même lorsque RouterLink est rendu via Primitive.
  // Cela garantit l'accessibilité du lien et un repli fonctionnel sans JS.
  return typeof to === 'string' ? to : undefined
})

const classes = computed(() => {
  return cn(
    buttonVariants({
      variant,
      size,
      shape
    }),
    active &&
      variant !== 'destructive' &&
      'bg-primary text-white font-bold border-primary/50 shadow-glass-sm z-10',
    disabled &&
      'opacity-50 cursor-not-allowed pointer-events-none hover:translate-y-0 active:scale-100 shadow-none',
    loading && 'opacity-80 cursor-wait pointer-events-none hover:translate-y-0 active:scale-100',
    className
  )
})

function handleClick(event: MouseEvent) {
  if (disabled || loading) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<template>
  <Primitive
    :as="resolvedAs"
    :as-child="asChild"
    :to="to"
    :href="resolvedHref"
    :type="!isLink && resolvedAs === 'button' ? type : undefined"
    :disabled="!isLink ? disabled || loading : undefined"
    :aria-disabled="disabled || loading"
    :aria-busy="loading"
    :class="classes"
    @click="handleClick"
  >
    <!-- Spinner de chargement -->
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

    <!-- Contenu / Label contextuel -->
    <span
      v-if="loading && loadingText"
      class="inline-flex items-center gap-2 text-inherit truncate"
    >
      {{ loadingText }}
    </span>
    <span v-else class="inline-flex items-center gap-2" :class="{ 'opacity-0': loading }">
      <slot />
    </span>
  </Primitive>
</template>
