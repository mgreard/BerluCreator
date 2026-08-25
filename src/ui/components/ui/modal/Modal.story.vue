<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'
import { Button } from '@/components/ui/button'
import type { ModalProps } from './types'

const isOpen = ref(false)
const isGlassOpen = ref(false)
const state = ref<ModalProps>({
  title: 'Modifier le projet',
  subtitle: 'Configurez les paramètres généraux de votre projet.',
  size: 'md',
  surface: 'solid',
  closeOnBackdrop: true,
  zIndex: 1100
})
</script>

<template>
  <Story title="Overlay/Modal" :layout="{ type: 'single' }">
    <Variant title="Interactive Trigger">
      <div
        class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-2xl"
      >
        <Button variant="primary" @click="isOpen = true"> Ouvrir la Fenêtre Modale </Button>
      </div>

      <Modal v-model="isOpen" v-bind="state">
        <div class="flex flex-col gap-4">
          <p class="text-sm text-text-secondary leading-relaxed">
            Les fenêtres modales utilisent une surface opaque et lisible, capturent le focus clavier
            conformément aux standards WAI-ARIA et se ferment avec la touche
            <kbd
              class="px-1.5 py-0.5 rounded bg-bg-elevated border border-border-default text-xs font-mono"
              >Échap</kbd
            >.
          </p>
        </div>

        <template #footer>
          <Button variant="secondary" @click="isOpen = false">Annuler</Button>
          <Button variant="primary" @click="isOpen = false">Enregistrer les modifications</Button>
        </template>
      </Modal>
    </Variant>

    <Variant title="Glass (Opt-in)">
      <div
        class="flex items-center justify-center p-12 bg-bg-base border border-border-default rounded-2xl"
      >
        <Button variant="secondary" @click="isGlassOpen = true">Ouvrir la variante glass</Button>
      </div>

      <Modal
        v-model="isGlassOpen"
        title="Surface vitrée optionnelle"
        subtitle="À réserver aux contextes visuels simples."
        surface="glass"
      >
        <p class="text-sm text-text-secondary">
          La classe glass reste disponible sans être imposée aux interfaces de travail.
        </p>
      </Modal>
    </Variant>
  </Story>
</template>
