<script setup lang="ts">
import PageLayout from './PageLayout.vue'
import { PageHeader } from '@/components/ui/page-header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Story title="Layout/PageLayout" :layout="{ type: 'single' }">
    <Variant title="Standard Page Layout with Sidebar">
      <div class="h-[500px] border border-border-default rounded-2xl overflow-hidden bg-bg-surface">
        <PageLayout mode="scroll" max-width="default">
          <template #header>
            <PageHeader
              title="Tableau de Bord Analytics"
              subtitle="Suivi des ventes et KPIs en direct"
              icon="📊"
            />
          </template>

          <template #toolbar>
            <div
              class="flex items-center gap-2 p-3 bg-bg-surface-hover/50 rounded-xl border border-border-default mb-4"
            >
              <Button size="sm" variant="secondary">7 derniers jours</Button>
              <Button size="sm" variant="ghost">Tous les segments</Button>
            </div>
          </template>

          <template #sidebar>
            <Card class="p-4">
              <h4 class="text-xs font-bold text-text-primary">Filtres Rapides</h4>
              <p class="text-xs text-text-muted mt-1">Options de filtrage secondaire.</p>
            </Card>
          </template>

          <div class="grid grid-cols-2 gap-4">
            <Card class="p-6">
              <h3 class="text-sm font-bold">Graphique des Revenus</h3>
              <div
                class="h-32 bg-primary/10 rounded-xl mt-3 flex items-center justify-center text-xs text-primary font-mono"
              >
                [Zone Graphique]
              </div>
            </Card>
            <Card class="p-6">
              <h3 class="text-sm font-bold">Conversions</h3>
              <div
                class="h-32 bg-primary/10 rounded-xl mt-3 flex items-center justify-center text-xs text-primary font-mono"
              >
                [Zone Graphique]
              </div>
            </Card>
          </div>
        </PageLayout>
      </div>
    </Variant>
  </Story>
</template>
