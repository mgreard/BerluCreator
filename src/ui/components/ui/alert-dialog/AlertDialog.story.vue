<script setup lang="ts">
import { ref } from 'vue'
import AlertDialog from './AlertDialog.vue'
import { Button } from '@/components/ui/button'
import type { AlertDialogProps } from './types'

const isOpen = ref(false)
const state = ref<AlertDialogProps>({
  title: 'Supprimer définitivement le projet ?',
  description:
    'Cette action est irréversible. Toutes les données associées seront définitivement supprimées de nos serveurs.',
  variant: 'danger',
  confirmText: 'Supprimer le projet',
  cancelText: 'Annuler',
  requireConfirmationText: 'SUPPRIMER'
})
</script>

<template>
  <Story title="Overlay/AlertDialog" :layout="{ type: 'single' }">
    <Variant title="Critical Destructive Action">
      <div
        class="flex items-center justify-center p-12 bg-bg-surface border border-border-default rounded-2xl"
      >
        <Button variant="destructive" @click="isOpen = true">
          Supprimer la ressource critique
        </Button>
      </div>

      <AlertDialog v-model:open="isOpen" v-bind="state" />
    </Variant>
  </Story>
</template>
