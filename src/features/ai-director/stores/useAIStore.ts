import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AIGenerationResponse, AIScriptBeat } from '@core/types/ai.types'
import { aiClientService } from '@infrastructure/ai/ai-client.service'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'

export const useAIStore = defineStore('aiDirector', () => {
  const scriptText = ref(
    'Bonjour à tous et bienvenue sur le plateau ! Nous avons une information exclusive et urgente qui vient de tomber. Regardez bien ces chiffres étonnants !'
  )
  const isGenerating = ref(false)
  const lastResponse = ref<AIGenerationResponse | null>(null)
  const errorMessage = ref<string | null>(null)

  async function generateSequence(durationMs: number) {
    const assetStore = useAssetStore()
    isGenerating.value = true
    errorMessage.value = null

    try {
      const response = await aiClientService.generateSequenceBeats({
        scriptText: scriptText.value,
        durationMs,
        availableAssetTags: assetStore.allTags
      })
      lastResponse.value = response
      return response
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error ? err.message : 'Erreur lors de la génération IA de la séquence.'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  function applyBeatsToTimeline(beats: AIScriptBeat[]) {
    const timelineStore = useTimelineStore()
    const assetStore = useAssetStore()

    for (const beat of beats) {
      // Trouver le meilleur asset correspondant au slot et au tag suggéré
      const matchingAsset =
        assetStore.assets.find(
          (a) =>
            a.category === beat.targetSlot &&
            (beat.suggestedTag ? a.tags.includes(beat.suggestedTag) : true)
        ) || assetStore.assets.find((a) => a.category === beat.targetSlot)

      timelineStore.addKeyframe(
        beat.targetSlot,
        beat.timeMs,
        matchingAsset ? matchingAsset.id : null,
        beat.action
      )
    }
  }

  return {
    scriptText,
    isGenerating,
    lastResponse,
    errorMessage,
    generateSequence,
    applyBeatsToTimeline
  }
})
