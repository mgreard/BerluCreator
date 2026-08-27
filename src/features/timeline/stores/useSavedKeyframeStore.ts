import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  SavedKeyframePreset,
  SavedKeyframeTrack,
  Sequence
} from '@core/types/timeline.types'
import { savedKeyframeRepository } from '@infrastructure/db/repositories/saved-keyframe.repository'
import { generateId } from '@/lib/utils'

export const useSavedKeyframeStore = defineStore('savedKeyframes', () => {
  const presets = ref<SavedKeyframePreset[]>([])
  const isLoading = ref(false)

  async function loadPresets() {
    isLoading.value = true
    try {
      presets.value = await savedKeyframeRepository.getAll()
    } finally {
      isLoading.value = false
    }
  }

  async function saveCurrentPose(
    sequence: Sequence,
    stepId: string,
    name: string,
    thumbnailDataUrl: string
  ): Promise<SavedKeyframePreset> {
    const now = Date.now()
    const tracks = captureVisibleTracks(sequence, stepId)
    const step = sequence.steps.find((candidate) => candidate.id === stepId)
    const referencedGroupIds = new Set(
      tracks.map((track) => track.sourceGroupId).filter((id): id is string => Boolean(id))
    )
    const groups = (sequence.groups ?? [])
      .filter((group) => referencedGroupIds.has(group.id))
      .map((group) => {
        const state = step?.groupStates.find((candidate) => candidate.groupId === group.id)
        return {
          sourceGroupId: group.id,
          name: group.name,
          zIndex: state?.zIndex ?? group.zIndex,
          transform: state?.transform ? { ...state.transform } : undefined
        }
      })

    const preset: SavedKeyframePreset = {
      id: generateId('saved_kf'),
      name: name.trim() || `Pose ${step?.label ?? ''}`.trim(),
      sourceStepLabel: step?.label,
      thumbnailDataUrl,
      tracks,
      groups,
      createdAt: now,
      updatedAt: now
    }

    await savedKeyframeRepository.create(preset)
    presets.value.unshift(preset)
    return preset
  }

  async function deletePreset(id: string) {
    await savedKeyframeRepository.delete(id)
    presets.value = presets.value.filter((preset) => preset.id !== id)
  }

  return { presets, isLoading, loadPresets, saveCurrentPose, deletePreset }
})

export function captureVisibleTracks(sequence: Sequence, stepId: string): SavedKeyframeTrack[] {
  const step = sequence.steps.find((candidate) => candidate.id === stepId)
  const mutedGroupIds = new Set(
    (step?.groupStates ?? []).filter((group) => group.muted).map((group) => group.groupId)
  )

  return sequence.tracks.flatMap((track) => {
    const active = track.keyframes.find((keyframe) => keyframe.stepId === stepId) ?? null
    if (active?.muted || mutedGroupIds.has(track.groupId)) return []
    if (!active || active.sprites.length === 0) return []

    return [{
      sourceTrackId: track.id,
      name: track.name,
      category: track.category,
      targetSlot: track.targetSlot,
      sourceGroupId: track.groupId,
      zIndex: active.zIndex,
      sprites: active.sprites.map((sprite) => ({
        assetId: sprite.assetId,
        transform: sprite.transform ? { ...sprite.transform } : undefined,
        label: sprite.label,
        order: sprite.order
      }))
    }]
  })
}
