<script setup lang="ts">
import { ref } from 'vue'
import CommandPalette from './CommandPalette.vue'
import { Button } from '@/components/ui/button'
import type { CommandGroup } from './types'

const isOpen = ref(false)

const groups: CommandGroup[] = [
  {
    name: 'Navigation',
    items: [
      { id: 'home', label: 'Aller à l’accueil', icon: 'home', shortcut: 'G H' },
      { id: 'docs', label: 'Consulter la documentation', icon: 'description', shortcut: 'G D' },
      { id: 'components', label: 'Explorer les composants', icon: 'widgets', shortcut: 'G C' }
    ]
  },
  {
    name: 'Actions Rapides',
    items: [
      { id: 'new-file', label: 'Créer un nouveau composant', icon: 'add', shortcut: '⌘ N' },
      {
        id: 'theme-toggle',
        label: 'Basculer le thème clair / sombre',
        icon: 'dark_mode',
        shortcut: '⌘ T'
      },
      { id: 'logout', label: 'Se déconnecter', icon: 'logout' }
    ]
  }
]
</script>

<template>
  <Story title="Navigation/CommandPalette" :layout="{ type: 'single' }">
    <Variant title="Interactive Palette">
      <div
        class="flex flex-col items-center justify-center p-12 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto gap-4"
      >
        <p class="text-xs text-text-muted text-center">
          Appuyez sur
          <kbd class="font-mono bg-bg-surface px-1.5 py-0.5 rounded border border-border-default"
            >⌘K</kbd
          >
          ou cliquez sur le bouton ci-dessous pour ouvrir la palette.
        </p>
        <Button variant="primary" @click="isOpen = true"> Ouvrir la palette de commandes </Button>

        <CommandPalette
          v-model:open="isOpen"
          :groups="groups"
          placeholder="Rechercher une action ou un raccourci..."
        />
      </div>
    </Variant>
  </Story>
</template>
