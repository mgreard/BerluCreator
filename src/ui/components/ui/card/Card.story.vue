<script setup lang="ts">
import { ref } from 'vue'
import Card from './Card.vue'
import type { CardProps, CardVariant, CardPadding } from './types'

const variants: CardVariant[] = ['default', 'interactive', 'elevated', 'flat']
const paddings: CardPadding[] = ['none', 'sm', 'md', 'lg']

const state = ref<CardProps>({
  variant: 'default',
  padding: 'md',
  clickable: false
})
</script>

<template>
  <Story title="Data Display/Card" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Variants">
      <div
        class="flex flex-col gap-4 p-6 bg-bg-surface border border-border-default rounded-xl w-full"
      >
        <Card variant="default">
          <h4 class="font-bold text-base">Carte Standard (Glass)</h4>
          <p class="text-sm text-text-secondary mt-1">Effet verre subtil avec bordures douces.</p>
        </Card>
        <Card variant="elevated">
          <h4 class="font-bold text-base">Carte Élevée (Glass Premium)</h4>
          <p class="text-sm text-text-secondary mt-1">Ombrage et profondeur accentués.</p>
        </Card>
        <Card variant="interactive">
          <h4 class="font-bold text-base">Carte Interactive</h4>
          <p class="text-sm text-text-secondary mt-1">Micro-animation au survol et au clic.</p>
        </Card>
      </div>
    </Variant>

    <Variant title="With Header and Footer">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl w-full">
        <Card variant="elevated">
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-primary"
                >Tableau de bord</span
              >
              <span class="text-xs text-text-muted">Il y a 5 min</span>
            </div>
          </template>

          <h3 class="text-lg font-bold">Rapport Trimestriel</h3>
          <p class="text-sm text-text-secondary mt-1">
            Les indicateurs de performance et de fidélisation ont progressé de 24% ce mois-ci.
          </p>

          <template #footer>
            <div class="flex items-center justify-between text-xs text-text-muted">
              <span>Statut : Validé</span>
              <button class="text-primary font-semibold hover:underline">Détails →</button>
            </div>
          </template>
        </Card>
      </div>
    </Variant>

    <Variant title="Consumer Classes">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl w-full">
        <Card :class="['consumer-card', { 'ring-2 ring-primary': true }]">
          <h4 class="font-bold text-base">Classes Vue compatibles</h4>
          <p class="text-sm text-text-secondary mt-1">
            La prop class accepte les chaînes, tableaux et objets conditionnels.
          </p>
        </Card>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div
          class="flex items-center justify-center p-8 bg-bg-surface border border-border-default rounded-xl w-full"
        >
          <Card v-bind="state">
            <h4 class="font-bold text-base">Titre de la Carte</h4>
            <p class="text-sm text-text-secondary mt-1">
              Contenu personnalisable depuis les contrôles.
            </p>
          </Card>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.padding" title="Padding" :options="paddings" />
        <HstCheckbox v-model="state.clickable" title="Clickable" />
      </template>
    </Variant>
  </Story>
</template>
