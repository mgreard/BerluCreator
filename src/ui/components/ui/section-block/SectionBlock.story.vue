<script setup lang="ts">
import SectionBlock from './SectionBlock.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Story title="Layout/SectionBlock" :layout="{ type: 'single' }">
    <Variant title="Standard Section Block">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-2xl mx-auto"
      >
        <SectionBlock
          title="Performances & Trafic"
          subtitle="Données agrégées sur les 30 derniers jours."
          icon="📈"
        >
          <template #actions>
            <Button size="sm" variant="secondary">Filtrer</Button>
          </template>

          <p class="text-sm text-text-secondary">Graphique et indicateurs clés de la section.</p>
        </SectionBlock>
      </div>
    </Variant>
  </Story>
</template>
