<script setup lang="ts">
import { ref } from 'vue'
import Drawer from './Drawer.vue'
import { Button } from '@/components/ui/button'
import type { DrawerProps } from './types'

const isOpen = ref(false)
const state = ref<DrawerProps>({
  title: 'Panneau de configuration',
  description: 'Ajustez les options de votre espace de travail.',
  side: 'right',
  size: 'md',
  modal: true
})
</script>

<template>
  <Story title="Overlay/Drawer" :layout="{ type: 'single' }">
    <Variant title="Interactive Drawer Trigger">
      <div
        class="flex flex-wrap items-center justify-center gap-4 p-12 bg-bg-surface border border-border-default rounded-2xl"
      >
        <Button variant="primary" @click="isOpen = true">
          Ouvrir le Tiroir ({{ state.side }})
        </Button>
      </div>

      <Drawer v-model:open="isOpen" v-bind="state">
        <div class="flex flex-col gap-4">
          <p class="text-sm text-text-secondary leading-relaxed">
            Le composant Drawer supporte l'apparition depuis les 4 côtés (`right`, `left`, `bottom`,
            `top`), avec gestion de l'effet tactile swipe/pull en mode bottom sheet et accessibilité
            complète.
          </p>
        </div>

        <template #footer>
          <Button variant="secondary" @click="isOpen = false">Fermer</Button>
          <Button variant="primary" @click="isOpen = false">Appliquer</Button>
        </template>
      </Drawer>
    </Variant>
  </Story>
</template>
