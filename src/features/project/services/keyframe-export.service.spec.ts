import { describe, expect, it } from 'vitest'
import type { Sequence, TimelineTrack } from '@core/types/timeline.types'
import {
  formatKeyframeFilename,
  get1080pExportResolution,
  getChangedKeyframeStepIds,
  sanitizeExportPrefix
} from './keyframe-export.service'

function track(id: string, keyframes: TimelineTrack['keyframes']): TimelineTrack {
  return {
    id,
    name: id,
    category: 'head',
    targetSlot: 'head',
    groupId: 'group',
    zIndex: 0,
    muted: false,
    locked: false,
    keyframes
  }
}

function sequence(tracks: TimelineTrack[]): Sequence {
  const camera = {
    enabled: false,
    x: 0,
    y: 0,
    width: 1792,
    height: 1024,
    aspectRatio: 'custom' as const
  }
  return {
    id: 'sequence',
    projectId: 'project',
    name: 'Test',
    steps: [
      { id: 'step-1', label: 'Étape 01', order: 0, groupStates: [], camera: { ...camera } },
      { id: 'step-2', label: 'Étape 02', order: 1, groupStates: [], camera: { ...camera } },
      { id: 'step-3', label: 'Étape 03', order: 2, groupStates: [], camera: { ...camera } },
      { id: 'step-4', label: 'Étape 04', order: 3, groupStates: [], camera: { ...camera } }
    ],
    tracks,
    createdAt: 0,
    updatedAt: 0
  }
}

describe('keyframe export', () => {
  it('conserve seulement les étapes qui changent l’état visible', () => {
    const source = sequence([
      track('head', [
        { id: 'kf-1', stepId: 'step-1', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-1', assetId: 'head-a', order: 0 }] },
        { id: 'kf-2', stepId: 'step-2', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-2', assetId: 'head-a', order: 0 }] },
        { id: 'kf-3', stepId: 'step-3', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-3', assetId: 'head-b', order: 0 }] },
        { id: 'kf-4', stepId: 'step-4', zIndex: 0, muted: false, locked: false, sprites: [] }
      ])
    ])

    expect(getChangedKeyframeStepIds(source)).toEqual(['step-1', 'step-3', 'step-4'])
  })

  it('merges simultaneous changes and ignores muted tracks', () => {
    const visible = track('head', [
      { id: 'kf-1', stepId: 'step-1', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-1', assetId: 'head-a', order: 0 }] },
      { id: 'kf-1b', stepId: 'step-2', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-1b', assetId: 'head-a', order: 0 }] },
      { id: 'kf-1c', stepId: 'step-3', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-1c', assetId: 'head-a', order: 0 }] },
      { id: 'kf-1d', stepId: 'step-4', zIndex: 0, muted: false, locked: false, sprites: [{ id: 'sprite-1d', assetId: 'head-a', order: 0 }] }
    ])
    const muted = track('hidden', [
      { id: 'kf-2a', stepId: 'step-1', zIndex: 0, muted: true, locked: false, sprites: [] },
      { id: 'kf-2', stepId: 'step-2', zIndex: 0, muted: true, locked: false, sprites: [{ id: 'sprite-2', assetId: 'head-b', order: 0 }] },
      { id: 'kf-2c', stepId: 'step-3', zIndex: 0, muted: true, locked: false, sprites: [] },
      { id: 'kf-2d', stepId: 'step-4', zIndex: 0, muted: true, locked: false, sprites: [] }
    ])
    muted.muted = true

    expect(getChangedKeyframeStepIds(sequence([visible, muted]))).toEqual(['step-1'])
  })

  it('sanitizes prefixes and pads sequential filenames', () => {
    expect(sanitizeExportPrefix('  Épisode / 4  ')).toBe('Episode-4')
    expect(formatKeyframeFilename('Épisode / 4', 3, 12)).toBe('Episode-4-03.png')
  })

  it('considère un changement de caméra seulement lorsque le cadrage est appliqué', () => {
    const source = sequence([])
    source.steps[1]!.camera = {
      enabled: true,
      x: 200,
      y: 0,
      width: 576,
      height: 1024,
      aspectRatio: '9:16'
    }

    expect(getChangedKeyframeStepIds(source)).toEqual(['step-1', 'step-2', 'step-3'])
    expect(getChangedKeyframeStepIds(source, false)).toEqual(['step-1'])
  })

  it('calcule une sortie 1080p sans déformer le ratio du cadre', () => {
    expect(get1080pExportResolution(
      { width: 1792, height: 1024 },
      { enabled: true, x: 0, y: 0, width: 576, height: 1024, aspectRatio: '9:16' }
    )).toEqual({ width: 1080, height: 1920 })
  })
})
