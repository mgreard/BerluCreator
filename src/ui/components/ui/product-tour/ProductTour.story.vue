<script setup lang="ts">
import { useTemplateRef } from 'vue'
import ProductTour from './ProductTour.vue'
import type { ProductTourExpose, ProductTourStep } from './types'
import { Button } from '@/components/ui/button'

const tourRef = useTemplateRef<ProductTourExpose>('tourRef')
const steps: ProductTourStep[] = [
  {
    element: '[data-demo-tour="library"]',
    popover: { title: 'Bibliothèque', description: 'Choisissez vos éléments ici.', side: 'right' }
  },
  {
    element: '[data-demo-tour="canvas"]',
    popover: { title: 'Aperçu', description: 'Composez votre scène au centre.', side: 'left' }
  }
]
</script>

<template>
  <Story title="Navigation/ProductTour" :layout="{ type: 'single' }">
    <div class="grid grid-cols-2 gap-4 p-8">
      <div data-demo-tour="library" class="rounded-xl border border-border-default p-8">
        Bibliothèque
      </div>
      <div data-demo-tour="canvas" class="rounded-xl border border-border-default p-8">
        Aperçu
      </div>
      <Button @click="tourRef?.start()">Démarrer le tour</Button>
    </div>
    <ProductTour ref="tourRef" :steps="steps" />
  </Story>
</template>
