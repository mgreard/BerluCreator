<script setup lang="ts">
import Breadcrumb from './Breadcrumb.vue'
import type { BreadcrumbItem } from './types'

const items: BreadcrumbItem[] = [
  { label: 'Accueil', href: '#' },
  { label: 'Administration', href: '#' },
  { label: 'Utilisateurs', href: '#' },
  { label: 'Profil de Jean Dupont', active: true }
]
</script>

<template>
  <Story title="Navigation/Breadcrumb" :layout="{ type: 'single' }">
    <Variant title="Standard & Custom Separators">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-lg mx-auto"
      >
        <div class="space-y-2">
          <label class="text-xs font-semibold text-text-muted">Séparateur Slash (/)</label>
          <Breadcrumb :items="items" />
        </div>

        <div class="space-y-2 pt-4 border-t border-border-default">
          <label class="text-xs font-semibold text-text-muted">Séparateur Chevron (›)</label>
          <Breadcrumb :items="items" separator="›" />
        </div>

        <div class="space-y-2 pt-4 border-t border-border-default">
          <label class="text-xs font-semibold text-text-muted">Version Compacte</label>
          <Breadcrumb :items="items" compact separator="→" />
        </div>
      </div>
    </Variant>
  </Story>
</template>
