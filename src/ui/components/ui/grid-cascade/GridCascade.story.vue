<script setup lang="ts">
import GridCascade from './GridCascade.vue'
import { Card } from '@/components/ui/card'
</script>

<template>
  <Story title="Layout/GridCascade" :layout="{ type: 'single' }">
    <Variant title="Auto-fit Responsive Grid">
      <div class="p-8 bg-bg-surface border border-border-default rounded-2xl max-w-4xl mx-auto">
        <GridCascade cols="auto-fit" gap="md">
          <Card v-for="i in 6" :key="i" class="p-5">
            <h3 class="text-sm font-bold text-text-primary">Carte {{ i }}</h3>
            <p class="text-xs text-text-muted mt-1">Disposition automatique auto-fit.</p>
          </Card>
        </GridCascade>
      </div>
    </Variant>
  </Story>
</template>
