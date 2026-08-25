<script setup lang="ts">
import ToastContainer from './ToastContainer.vue'
import { Button } from '@/components/ui/button'
import { toast } from '@/shared/services/toast.service'

function showSuccessToast() {
  toast.success('Sauvegarde réussie', 'Toutes les modifications ont été enregistrées avec succès.')
}

function showInfoToast() {
  toast.info('Information', 'Une synchronisation aura lieu dans quelques instants.')
}

function showWarningToast() {
  toast.warning('Attention', 'Votre session expire dans moins de 5 minutes.')
}

function showErrorToast() {
  toast.error(
    'Échec de la connexion',
    'Impossible d’établir une connexion avec le serveur distant.'
  )
}
</script>

<template>
  <Story title="Feedback/ToastContainer" :layout="{ type: 'single' }">
    <Variant title="Trigger Toasts Demo">
      <div
        class="flex flex-col gap-4 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-lg"
      >
        <h3 class="font-bold text-base text-text-primary mb-2">
          Déclencher des Notifications Toast
        </h3>
        <div class="flex flex-wrap gap-3">
          <Button variant="primary" @click="showSuccessToast"> Toast Succès </Button>
          <Button variant="secondary" @click="showInfoToast"> Toast Info </Button>
          <Button
            variant="secondary"
            class="text-warning border-warning/40"
            @click="showWarningToast"
          >
            Toast Warning
          </Button>
          <Button variant="destructive" @click="showErrorToast"> Toast Erreur </Button>
        </div>
      </div>
      <ToastContainer :z-index="10000" />
    </Variant>
  </Story>
</template>
