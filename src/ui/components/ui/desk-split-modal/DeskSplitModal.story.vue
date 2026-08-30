<script setup lang="ts">
import { ref } from 'vue'
import DeskSplitModal from './DeskSplitModal.vue'
import { Button } from '@/components/ui/button'
import type { Asset } from '@core/types/asset.types'

const isOpen = ref(false)

const mockAsset: Asset = {
  id: 'asset-desk-demo',
  name: 'Piscine Studio 2.5D',
  category: 'desk',
  tags: ['desk', 'pool'],
  blobId: 'blob-pool-mock',
  width: 1200,
  height: 700,
  isMovable: true,
  createdAt: 100,
  updatedAt: 100
}
</script>

<template>
  <Story title="Studio/DeskSplitModal" :layout="{ type: 'single' }">
    <Variant title="Interactive Calibration">
      <div class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-2xl">
        <Button variant="primary" @click="isOpen = true">
          Ouvrir Calibration Découpe Bureau
        </Button>
      </div>

      <DeskSplitModal
        v-model="isOpen"
        :asset="mockAsset"
        @save="console.log('Saved split:', $event)"
      />
    </Variant>
  </Story>
</template>
