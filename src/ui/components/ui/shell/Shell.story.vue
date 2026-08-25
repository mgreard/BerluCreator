<script setup lang="ts">
import { ref } from 'vue'
import Shell from './Shell.vue'
import { Button } from '@/components/ui/button'

const sidebarOpen = ref(true)
</script>

<template>
  <Story title="Layout/Shell" :layout="{ type: 'single' }">
    <Variant title="Application Shell Responsive">
      <div class="h-[600px] border border-border-default rounded-2xl overflow-hidden">
        <Shell
          v-model:sidebar-open="sidebarOpen"
          brand-title="MyCompLib Admin"
          brand-icon="diamond"
        >
          <template #sidebar="{ isCollapsed }">
            <nav class="flex flex-col gap-1">
              <a
                href="#"
                class="flex items-center gap-3 p-2 rounded-xl text-sm font-medium bg-primary/10 text-primary"
              >
                <span>🏠</span>
                <span v-if="!isCollapsed">Dashboard</span>
              </a>
              <a
                href="#"
                class="flex items-center gap-3 p-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-surface-hover"
              >
                <span>📊</span>
                <span v-if="!isCollapsed">Statistiques</span>
              </a>
              <a
                href="#"
                class="flex items-center gap-3 p-2 rounded-xl text-sm font-medium text-text-secondary hover:bg-bg-surface-hover"
              >
                <span>⚙️</span>
                <span v-if="!isCollapsed">Paramètres</span>
              </a>
            </nav>
          </template>

          <template #header-actions>
            <Button size="sm" variant="secondary">Mon Profil</Button>
          </template>

          <div class="p-8">
            <h2 class="text-lg font-bold text-text-primary">Bienvenue sur le Shell</h2>
            <p class="text-xs text-text-muted mt-1">
              Structure d'application globale avec barre latérale rétractable et tiroir mobile.
            </p>
          </div>
        </Shell>
      </div>
    </Variant>
  </Story>
</template>
