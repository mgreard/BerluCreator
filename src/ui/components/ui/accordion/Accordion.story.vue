<script setup lang="ts">
import { ref } from 'vue'
import Accordion from './Accordion.vue'
import type { AccordionProps, AccordionItemData } from './types'

const items: AccordionItemData[] = [
  {
    value: 'item-1',
    title: 'Qu’est-ce que MyCompLib ?',
    subtitle: 'Architecture & Fondations',
    icon: '⚡',
    badge: 'Guide',
    content:
      'Une bibliothèque de composants UI moderne pour Vue 3.5+, TypeScript et Tailwind CSS v4 avec Reka UI.'
  },
  {
    value: 'item-2',
    title: 'Comment installer et démarrer ?',
    subtitle: 'Guide de démarrage rapide',
    icon: '📦',
    badge: 'v1.0',
    content:
      'Installez les dépendances via `pnpm install` puis lancez le serveur Histoire avec `pnpm story`.'
  },
  {
    value: 'item-3',
    title: 'Section avancée',
    subtitle: 'Accessible aux administrateurs',
    icon: '🔒',
    disabled: false,
    content: 'Gestion des tokens de thème OKLCH, animations réactives et glassmorphism.'
  }
]

const state = ref<AccordionProps>({
  items,
  type: 'single',
  collapsible: true,
  variant: 'card'
})
</script>

<template>
  <Story title="Data Display/Accordion" :layout="{ type: 'single' }">
    <Variant title="Card Accordion">
      <div class="p-8 bg-bg-surface border border-border-default rounded-2xl max-w-xl mx-auto">
        <Accordion v-bind="state" />
      </div>
    </Variant>
  </Story>
</template>
