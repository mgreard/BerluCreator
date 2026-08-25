<script setup lang="ts">
import { useAIStore } from '../stores/useAIStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import ScriptPromptInput from './ScriptPromptInput.vue'
import AIBeatsPreview from './AIBeatsPreview.vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Alert } from '@/components/ui/alert'

const { open = false } = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const aiStore = useAIStore()
const timelineStore = useTimelineStore()

async function handleGenerate() {
  await aiStore.generateSequence(timelineStore.currentSequence.durationMs)
}

function handleApply() {
  if (aiStore.lastResponse) {
    aiStore.applyBeatsToTimeline(aiStore.lastResponse.beats)
    emit('update:open', false)
  }
}
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    title="Assistant Scénariste & Metteur en Scène IA"
    description="Générez automatiquement la séquence d'animation stop-motion (poses, émotions, phonèmes, bandeaux) à partir de votre texte brut."
    @update:open="emit('update:open', $event)"
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

        <span class="text-xs text-muted-foreground font-mono">
          Durée cible : {{ (timelineStore.currentSequence.durationMs / 1000).toFixed(1) }}s
        </span>
      </div>

      <!-- Résultat de la génération IA -->
      <div v-if="aiStore.lastResponse" class="space-y-2 border-t border-border/40 pt-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-foreground">
            Beats et Poses Proposés ({{ aiStore.lastResponse.beats.length }}) :
          </span>
          <span class="text-[11px] text-muted-foreground">{{ aiStore.lastResponse.summary }}</span>
        </div>

        <AIBeatsPreview :beats="aiStore.lastResponse.beats" />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" @click="emit('update:open', false)">
          Fermer
        </Button>
        <Button
          v-if="aiStore.lastResponse"
          variant="primary"
          size="sm"
          class="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
          @click="handleApply"
        >
          <Icon name="playlist_add_check" size="sm" />
          <span>Injecter dans la timeline</span>
        </Button>
      </div>
    </template>
  </Modal>
</template>
