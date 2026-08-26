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
    timeMs: number,
    name: string,
    thumbnailDataUrl: string
  ): Promise<SavedKeyframePreset> {
    const now = Date.now()
    const tracks = captureVisibleTracks(sequence, timeMs)
    const referencedGroupIds = new Set(
      tracks.map((track) => track.sourceGroupId).filter((id): id is string => Boolean(id))
    )
    const groups = (sequence.groups ?? [])
      .filter((group) => referencedGroupIds.has(group.id))
      .map((group) => ({
        sourceGroupId: group.id,
        name: group.name,
        zIndex: group.zIndex,
        transform: group.transform ? { ...group.transform } : undefined
      }))

    const preset: SavedKeyframePreset = {
      id: generateId('saved_kf'),
      name: name.trim() || `Keyframe ${formatTime(timeMs)}`,
      sourceTimeMs: timeMs,
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

export function captureVisibleTracks(sequence: Sequence, timeMs: number): SavedKeyframeTrack[] {
  const mutedGroupIds = new Set(
    (sequence.groups ?? []).filter((group) => group.muted).map((group) => group.id)
  )

  return sequence.tracks.flatMap((track) => {
    if (track.muted || (track.groupId && mutedGroupIds.has(track.groupId))) return []
    const active = track.keyframes.reduce(
      (result, keyframe) =>
        keyframe.timeMs <= timeMs && (!result || keyframe.timeMs > result.timeMs)
          ? keyframe
          : result,
      null as (typeof track.keyframes)[number] | null
    )
    if (!active || active.sprites.length === 0) return []

    return [{
      sourceTrackId: track.id,
      name: track.name,
      category: track.category,
      targetSlot: track.targetSlot,
      sourceGroupId: track.groupId,
      zIndex: track.zIndex,
      sprites: active.sprites.map((sprite) => ({
        assetId: sprite.assetId,
        transform: sprite.transform ? { ...sprite.transform } : undefined,
        label: sprite.label,
        order: sprite.order
      }))
    }]
  })
}

function formatTime(timeMs: number) {
  return `${(timeMs / 1000).toFixed(2)}s`
}
