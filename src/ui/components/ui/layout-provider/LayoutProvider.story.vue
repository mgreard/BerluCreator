<script setup lang="ts">
import { ref } from 'vue'
import LayoutProvider from './LayoutProvider.vue'
import type { LayoutType } from './types'

const activeLayout = ref<LayoutType>('default')
</script>

<template>
  <Story title="Layout/LayoutProvider" :layout="{ type: 'single' }">
    <Variant title="Dynamic Layout Provider">
      <div
        class="p-8 bg-bg-surface border border-border-default rounded-2xl max-w-xl mx-auto space-y-4"
      >
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-1 text-xs rounded-lg border border-border-default bg-bg-surface-hover cursor-pointer"
            @click="activeLayout = 'default'"
          >
            Défaut
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs rounded-lg border border-border-default bg-bg-surface-hover cursor-pointer"
            @click="activeLayout = 'auth'"
          >
            Auth
          </button>
          <button
            type="button"
            class="px-3 py-1 text-xs rounded-lg border border-border-default bg-bg-surface-hover cursor-pointer"
            @click="activeLayout = 'dashboard'"
          >
            Dashboard
          </button>
        </div>

        <LayoutProvider :layout="activeLayout">
          <div
            class="p-4 border border-dashed border-border-default rounded-xl text-center text-xs text-text-muted"
          >
            Contenu injecté dans le Layout [{{ activeLayout }}]
          </div>
        </LayoutProvider>
      </div>
    </Variant>
  </Story>
</template>
