<script setup lang="ts">
import { ref } from 'vue'
import EmptyState from './EmptyState.vue'
import { Button } from '@/components/ui/button'
import type { EmptyStateProps } from './types'

const state = ref<EmptyStateProps>({
  icon: 'search_off',
  title: 'Aucun résultat trouvé',
  description: 'Essayez d’ajuster vos critères de recherche ou vos filtres.'
})
</script>

<template>
  <Story title="Feedback/EmptyState" :layout="{ type: 'grid', width: '380px' }">
    <Variant title="Default Search Empty">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <EmptyState
          icon="search_off"
          title="Aucun résultat trouvé"
          description="Nous n'avons trouvé aucun élément correspondant à votre requête."
        >
          <template #action>
            <Button size="sm" variant="secondary">Réinitialiser les filtres</Button>
          </template>
        </EmptyState>
      </div>
    </Variant>

    <Variant title="First Project Creation">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <EmptyState
          icon="folder_open"
          title="Aucun projet pour le moment"
          description="Commencez par créer votre premier projet pour collaborer avec votre équipe."
        >
          <template #action>
            <Button size="sm" variant="primary">Créer un projet</Button>
          </template>
        </EmptyState>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div class="p-8 bg-bg-surface border border-border-default rounded-xl w-full">
          <EmptyState v-bind="state">
            <template #action>
              <Button size="sm" variant="primary">Action principale</Button>
            </template>
          </EmptyState>
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.icon" title="Icon / Emoji" />
        <HstText v-model="state.title" title="Title" />
        <HstText v-model="state.description" title="Description" />
      </template>
    </Variant>
  </Story>
</template>
