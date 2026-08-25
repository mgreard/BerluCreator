<script setup lang="ts">
import { ref } from 'vue'
import DashboardLayout from './DashboardLayout.vue'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const sidebarOpen = ref(true)
</script>

<template>
  <Story title="Layout/DashboardLayout" :layout="{ type: 'single' }">
    <Variant title="Complete Dashboard Layout">
      <div class="h-[600px] border border-border-default rounded-2xl overflow-hidden">
        <DashboardLayout
          v-model:sidebar-open="sidebarOpen"
          brand-title="Analytics Studio"
          brand-icon="insights"
        >
          <template #sidebar="{ isCollapsed }">
            <nav class="flex flex-col gap-1">
              <a
                href="#"
                class="flex items-center gap-3 p-2 rounded-xl text-sm font-medium bg-primary/10 text-primary"
              >
                <span>📊</span>
                <span v-if="!isCollapsed">Aperçu</span>
              </a>
              <a
                href="#"
                class="flex items-center gap-3 p-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-surface-hover"
              >
                <span>📁</span>
                <span v-if="!isCollapsed">Projets</span>
              </a>
            </nav>
          </template>

          <template #header-actions>
            <Button size="sm" variant="secondary">Notifications</Button>
          </template>

          <div class="space-y-4">
            <h2 class="text-base font-bold">Vue d'ensemble</h2>
            <div class="grid grid-cols-3 gap-4">
              <Card v-for="i in 3" :key="i" class="p-4">
                <span class="text-xs text-text-muted">KPI {{ i }}</span>
                <p class="text-xl font-bold mt-1">€ {{ i * 1250 }}</p>
              </Card>
            </div>
          </div>
        </DashboardLayout>
      </div>
    </Variant>
  </Story>
</template>
