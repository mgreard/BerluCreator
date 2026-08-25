<script setup lang="ts">
import { useAIStore } from '../stores/useAIStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import ScriptPromptInput from './ScriptPromptInput.vue'
import AIBeatsPreview from './AIBeatsPreview.vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Alert } from '@/components/ui/alert'

const open = defineModel<boolean>('open', { default: false })

const aiStore = useAIStore()
const timelineStore = useTimelineStore()

async function handleGenerate() {
  await aiStore.generateSequence(timelineStore.currentSequence.durationMs)
}

function handleApply() {
  if (aiStore.lastResponse) {
    aiStore.applyBeatsToTimeline(aiStore.lastResponse.beats)
    open.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="lg"
    title="Assistant Scénariste & Metteur en Scène IA"
    subtitle="Générez automatiquement la séquence d'animation stop-motion (poses, émotions, phonèmes, bandeaux) à partir de votre texte brut."
  >
    <div class="space-y-4">
      <ScriptPromptInput v-model="aiStore.scriptText" />

      <Alert v-if="aiStore.errorMessage" variant="danger" title="Erreur de génération">
        {{ aiStore.errorMessage }}
      </Alert>

      <div class="flex items-center justify-between border-t border-border/40 pt-3">
        <Button
          variant="primary"
          size="sm"
          :loading="aiStore.isGenerating"
          loading-text="Analyse par le LLM en cours..."
          class="gap-1.5"
          @click="handleGenerate"
        >
          <Icon name="auto_awesome" size="sm" class="text-amber-300" />
          <span>Générer le découpage de scène</span>
        </Button>
      </div>

      <!-- Prévisualisation des Beats & Keyframes générées par le LLM -->
      <AIBeatsPreview
        v-if="aiStore.lastResponse"
        :beats="aiStore.lastResponse.beats"
      />
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" @click="open = false">
          Annuler
        </Button>
        <Button
          v-if="aiStore.lastResponse"
          variant="primary"
          size="sm"
          class="gap-1.5"
          @click="handleApply"
        >
          <Icon name="check" size="xs" />
          <span>Injecter dans la Timeline</span>
        </Button>
      </div>
    </template>
  </Modal>
</template>
