<script setup lang="ts">
import { ref } from 'vue'
import Tabs from './Tabs.vue'
import type { TabItem } from './types'

const activeTab = ref('general')
const activeRailTab = ref('all')

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

const railItems: TabItem[] = [
  { key: 'all', label: 'Tous les sprites', icon: 'apps', badge: 48, tone: 'indigo' },
  { key: 'background', label: 'Arrière-plans', icon: 'tv_gen', badge: 1, tone: 'sky' },
  { key: 'body', label: 'Corps', icon: 'body_system', badge: 1, tone: 'amber' },
  { key: 'head', label: 'Têtes', icon: 'face', badge: 7, tone: 'rose' },
  { key: 'eyes', label: 'Accessoires visage', icon: 'visibility', badge: 4, tone: 'cyan' },
  { key: 'props_host', label: 'Accessoires', icon: 'apparel', badge: 6, tone: 'purple' },
  { key: 'props_set', label: 'Accessoires plateau', icon: 'category', badge: 10, tone: 'yellow' },
  { key: 'desk', label: 'Bureau', icon: 'desk', badge: 2, tone: 'neutral' },
  { key: 'props_desk', label: 'Objets du bureau', icon: 'inventory_2', badge: 16, tone: 'indigo' },
  { key: 'foreground', label: 'Premier plan', icon: 'filter_frames', badge: 1, tone: 'red' }
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

    <Variant title="Vertical Color Rail">
      <div class="h-[540px] w-24 overflow-hidden rounded-3xl border border-border-default bg-bg-base p-2">
        <Tabs
          v-model="activeRailTab"
          :tabs="railItems"
          variant="rail"
          orientation="vertical"
          aria-label="Catégories de sprites"
        />
      </div>
    </Variant>
  </Story>
</template>
