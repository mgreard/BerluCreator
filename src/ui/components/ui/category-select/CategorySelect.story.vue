<script setup lang="ts">
import { ref } from 'vue'
import type { AssetCategory } from '@core/types/asset.types'
import CategorySelect from './CategorySelect.vue'

const category = ref<AssetCategory>('mouth')
</script>

<template>
  <Story title="Forms/CategorySelect" :layout="{ type: 'grid', width: '360px' }">
    <Variant title="Interactif">
      <CategorySelect v-model="category" />
    </Variant>
  </Story>
</template>
