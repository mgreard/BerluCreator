<script setup lang="ts">
import { ref } from 'vue'
import LightboxModal from './LightboxModal.vue'
import { Button } from '@/components/ui/button'
import type { LightboxModalProps } from './types'

const isOpen = ref(false)
const state = ref<LightboxModalProps>({
  imageUrl:
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
  altText: 'Dégradé abstrait multicolore',
  caption: 'Composition artistique moderne - Nuances fluides OKLCH',
  zIndex: 1000
})
</script>

<template>
  <Story title="Overlay/LightboxModal" :layout="{ type: 'single' }">
    <Variant title="Interactive Preview">
      <div
        class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-2xl"
      >
        <Button variant="primary" @click="isOpen = true"> Visualiser l'image plein écran </Button>
      </div>

      <LightboxModal v-model:open="isOpen" v-bind="state" />
    </Variant>
  </Story>
</template>
