<script setup lang="ts">
import { ref } from 'vue'
import Alert from './Alert.vue'
import { Button } from '@/components/ui/button'
import type { AlertProps, AlertVariant } from './types'

const variants: AlertVariant[] = ['info', 'success', 'warning', 'danger']

const state = ref<AlertProps>({
  variant: 'info',
  title: 'Mise à jour disponible',
  dismissible: true,
  showIcon: true,
  iconName: ''
})
</script>

<template>
  <Story title="Feedback/Alert" :layout="{ type: 'grid', width: '380px' }">
    <Variant v-for="v in variants" :key="v" :title="`Variant: ${v}`">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <Alert :variant="v" :title="`Alerte de type ${v}`">
          Ceci est un message descriptif fournissant des indications contextuelles à l'utilisateur.
        </Alert>
      </div>
    </Variant>

    <Variant title="With Action Buttons">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <Alert variant="warning" title="Espace disque faible" :dismissible="true">
          Il ne vous reste que 2 Go d'espace de stockage disponible.
          <template #actions>
            <Button size="sm" variant="secondary">Libérer de l'espace</Button>
            <Button size="sm" variant="ghost">Ignorer</Button>
          </template>
        </Alert>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div class="p-8 bg-bg-surface border border-border-default rounded-xl w-full">
          <Alert v-bind="state">
            Message dynamique avec paramètres personnalisés depuis les contrôles Histoire.
          </Alert>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstText v-model="state.title" title="Title" />
        <HstCheckbox v-model="state.dismissible" title="Dismissible" />
        <HstCheckbox v-model="state.showIcon" title="Show Icon" />
        <HstText v-model="state.iconName" title="Custom Icon" />
      </template>
    </Variant>
  </Story>
</template>
