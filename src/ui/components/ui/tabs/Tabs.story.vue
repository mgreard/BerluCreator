<script setup lang="ts">
import { ref } from 'vue'
import Tabs from './Tabs.vue'
import type { TabItem } from './types'

const activeTab = ref('general')

const tabItems: TabItem[] = [
  {
    key: 'general',
    label: 'Général',
    icon: '⚙️',
    content: 'Configuration générale du système et préférences utilisateur.'
  },
  {
    key: 'security',
    label: 'Sécurité & 2FA',
    icon: '🔒',
    badge: 'Actif',
    content: 'Paramètres d’authentification à double facteur et sessions actives.'
  },
  {
    key: 'billing',
    label: 'Facturation',
    icon: '💳',
    content: 'Historique des factures et moyens de paiement.'
  },
  { key: 'integrations', label: 'Intégrations', icon: '🔌', disabled: true }
]
</script>

<template>
  <Story title="Navigation/Tabs" :layout="{ type: 'single' }">
    <Variant title="All Tab Styles (Capsule, Segmented, Underline)">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-xl mx-auto"
      >
        <div class="space-y-3">
          <label class="text-xs font-semibold text-text-primary"
            >Style Capsule (Pilule animée)</label
          >
          <Tabs v-model="activeTab" :tabs="tabItems" variant="capsule" />
        </div>

        <div class="space-y-3 pt-4 border-t border-border-default">
          <label class="text-xs font-semibold text-text-primary"
            >Style Segmented (Plein écran)</label
          >
          <Tabs v-model="activeTab" :tabs="tabItems" variant="segmented" />
        </div>

        <div class="space-y-3 pt-4 border-t border-border-default">
          <label class="text-xs font-semibold text-text-primary"
            >Style Underline (Bordure inférieure)</label
          >
          <Tabs v-model="activeTab" :tabs="tabItems" variant="underline" />
        </div>
      </div>
    </Variant>
  </Story>
</template>
