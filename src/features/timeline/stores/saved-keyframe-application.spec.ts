import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { SavedKeyframePreset } from '@core/types/timeline.types'
import { sequenceRepository } from '@infrastructure/db/repositories/sequence.repository'
import { useTimelineStore } from './useTimelineStore'

vi.mock('@infrastructure/db/repositories/sequence.repository', () => ({
  sequenceRepository: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('application d’une keyframe enregistrée', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('reproduit la pose à l’étape active et masque les pistes absentes', async () => {
    const store = useTimelineStore()
    const targetTrack = store.currentSequence.tracks.find((track) => track.category === 'head')!
    const otherTrack = store.currentSequence.tracks.find((track) => track.id !== targetTrack.id)!
    const firstStepId = store.activeStep!.id
    store.addKeyframe(targetTrack.id, firstStepId, 'asset-before')
    store.addKeyframe(otherTrack.id, firstStepId, 'asset-to-hide')
    const activeStep = store.addStepAfter(firstStepId)
    vi.mocked(sequenceRepository.save).mockClear()

    const group = store.currentSequence.groups?.find((item) => item.id === targetTrack.groupId)
    const preset: SavedKeyframePreset = {
      id: 'saved',
      name: 'Pose test',
      sourceTimeMs: 300,
      thumbnailDataUrl: 'data:image/png;base64,test',
      groups: group
        ? [{
            sourceGroupId: group.id,
            name: group.name,
            zIndex: group.zIndex,
            transform: { x: 20, scaleX: 1.1 }
          }]
        : [],
      tracks: [{
        sourceTrackId: targetTrack.id,
        name: targetTrack.name,
        category: targetTrack.category,
        targetSlot: targetTrack.targetSlot,
        sourceGroupId: targetTrack.groupId,
        zIndex: targetTrack.zIndex,
        sprites: [{ assetId: 'asset-saved', transform: { x: 64, y: 32 }, order: 0 }]
      }],
      createdAt: 1,
      updatedAt: 1
    }

    await expect(store.applySavedKeyframe(preset)).resolves.toBe(1)

    expect(targetTrack.keyframes.find((keyframe) => keyframe.stepId === activeStep.id)?.sprites)
      .toMatchObject([{ assetId: 'asset-saved', transform: { x: 64, y: 32 }, order: 0 }])
    expect(otherTrack.keyframes.find((keyframe) => keyframe.stepId === activeStep.id)?.sprites).toEqual([])
    expect(group?.transform).toEqual({ x: 20, scaleX: 1.1 })
    expect(sequenceRepository.save).toHaveBeenCalledTimes(2)
  })
})
