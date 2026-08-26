import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTimelineStore } from './useTimelineStore'
import type { Keyframe } from '@core/types/timeline.types'

vi.mock('@infrastructure/db/repositories/sequence.repository', () => ({
  sequenceRepository: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('sélection du périmètre d’édition du studio', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sélectionne un groupe avec une piste enfant cohérente', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups?.find((candidate) =>
      store.currentSequence.tracks.some((track) => track.groupId === candidate.id)
    )
    expect(group).toBeDefined()

    store.selectGroupForEditing(group!.id)

    expect(store.selectedGroupId).toBe(group!.id)
    expect(store.editScope).toBe('group')
    expect(
      store.currentSequence.tracks.find((track) => track.id === store.selectedTrackId)?.groupId
    ).toBe(group!.id)
  })

  it('synchronise le groupe parent lors de la sélection d’une piste', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks.find((candidate) => candidate.groupId)
    expect(track).toBeDefined()

    store.selectTrackForEditing(track!.id)

    expect(store.selectedTrackId).toBe(track!.id)
    expect(store.selectedGroupId).toBe(track!.groupId)
    expect(store.editScope).toBe('layer')
  })

  it('réinitialise ensemble la piste, le groupe et le mode', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks[0]
    store.selectTrackForEditing(track.id)

    store.clearStudioSelection()

    expect(store.selectedTrackId).toBeNull()
    expect(store.selectedGroupId).toBeNull()
    expect(store.selectedKeyframeId).toBeNull()
    expect(store.editScope).toBe('group')
  })
})

describe('historique des transformations du canvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('annule puis rétablit la transformation complète d’un groupe', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    const before = { ...group.transform }
    group.transform = { ...group.transform, x: 120, y: -35, scaleX: 1.5, scaleY: 1.5 }
    const after = { ...group.transform }

    store.recordTransformAction({ kind: 'group', groupId: group.id }, before, after)
    expect(store.canUndoTransform).toBe(true)

    store.undoLastTransform()
    expect(group.transform).toEqual(before)
    expect(store.canRedoTransform).toBe(true)

    store.redoLastTransform()
    expect(group.transform).toEqual(after)
    expect(store.canUndoTransform).toBe(true)
  })

  it('restaure aussi l’absence initiale de transform sur une keyframe', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks[0]
    const keyframe: Keyframe = {
      id: 'kf_history',
      timeMs: 0,
      assetId: null,
      transform: undefined
    }
    track.keyframes.push(keyframe)
    keyframe.transform = { x: 24, y: 18, scaleX: 0.8, scaleY: 0.8 }

    store.recordTransformAction(
      { kind: 'keyframe', trackId: track.id, keyframeId: keyframe.id },
      undefined,
      keyframe.transform
    )
    store.undoLastTransform()
    expect(keyframe.transform).toBeUndefined()

    store.redoLastTransform()
    expect(keyframe.transform).toEqual({ x: 24, y: 18, scaleX: 0.8, scaleY: 0.8 })
  })

  it('invalide le redo dès qu’une nouvelle transformation est enregistrée', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    const initial = { ...group.transform }
    group.transform = { ...group.transform, x: 10 }
    store.recordTransformAction(
      { kind: 'group', groupId: group.id },
      initial,
      group.transform
    )
    store.undoLastTransform()
    expect(store.canRedoTransform).toBe(true)

    const beforeSecondAction = { ...group.transform }
    group.transform = { ...group.transform, y: 25 }
    store.recordTransformAction(
      { kind: 'group', groupId: group.id },
      beforeSecondAction,
      group.transform
    )

    expect(store.canRedoTransform).toBe(false)
  })

  it('ignore une interaction sans changement réel', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    const snapshot = { ...group.transform }

    store.recordTransformAction(
      { kind: 'group', groupId: group.id },
      snapshot,
      { ...snapshot }
    )

    expect(store.canUndoTransform).toBe(false)
  })
})
