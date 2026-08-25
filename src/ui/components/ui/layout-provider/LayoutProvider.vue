<script setup lang="ts">
import { computed, defineAsyncComponent, markRaw, toRaw, type Component } from 'vue'
import type { LayoutProviderProps } from './types'

const { layout = 'default' } = defineProps<LayoutProviderProps>()

// Code Splitting chirurgical via defineAsyncComponent pour optimiser le LCP
const DashboardLayout = defineAsyncComponent(
  () => import('@/components/ui/dashboard-layout/DashboardLayout.vue')
)
const AuthLayout = defineAsyncComponent(() => import('@/components/ui/auth-layout/AuthLayout.vue'))

const resolvedLayoutComponent = computed(() => {
  if ((typeof layout === 'object' && layout !== null) || typeof layout === 'function') {
    return markRaw(toRaw(layout as Component))
  }

  switch (layout) {
    case 'dashboard':
      return DashboardLayout
    case 'auth':
      return AuthLayout
    case 'default':
    default:
      return 'div'
  }
})
</script>

<template>
  <component :is="resolvedLayoutComponent">
    <slot />
  </component>
</template>
