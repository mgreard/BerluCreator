import { describe, expect, it } from 'vitest'
import type { Sequence, TimelineTrack } from '@core/types/timeline.types'
import {
  formatKeyframeFilename,
  getChangedKeyframeTimes,
  sanitizeExportPrefix
} from './keyframe-export.service'

function track(id: string, keyframes: TimelineTrack['keyframes']): TimelineTrack {
  return {
    id,
    name: id,
    category: 'head',
    targetSlot: 'head',
    zIndex: 0,
    muted: false,
    locked: false,
    keyframes
  }
}

function sequence(tracks: TimelineTrack[]): Sequence {
  return {
    id: 'sequence',
    projectId: 'project',
    name: 'Test',
    durationMs: 5_000,
    fps: 25,
    tracks,
    createdAt: 0,
    updatedAt: 0
  }
}

describe('keyframe export', () => {
  it('keeps only timestamps that change the visible sprite state', () => {
    const source = sequence([
      track('head', [
        { id: 'kf-1', timeMs: 0, sprites: [{ id: 'sprite-1', assetId: 'head-a', order: 0 }] },
        { id: 'kf-2', timeMs: 500, sprites: [{ id: 'sprite-2', assetId: 'head-a', order: 0 }] },
        { id: 'kf-3', timeMs: 1_000, sprites: [{ id: 'sprite-3', assetId: 'head-b', order: 0 }] },
        { id: 'kf-4', timeMs: 1_500, sprites: [] }
      ])
    ])

    expect(getChangedKeyframeTimes(source)).toEqual([0, 1_000, 1_500])
  })

  it('merges simultaneous changes and ignores muted tracks', () => {
    const visible = track('head', [
      { id: 'kf-1', timeMs: 250, sprites: [{ id: 'sprite-1', assetId: 'head-a', order: 0 }] }
    ])
    const muted = track('hidden', [
      { id: 'kf-2', timeMs: 500, sprites: [{ id: 'sprite-2', assetId: 'head-b', order: 0 }] }
    ])
    muted.muted = true

    expect(getChangedKeyframeTimes(sequence([visible, muted]))).toEqual([250])
  })

  it('sanitizes prefixes and pads sequential filenames', () => {
    expect(sanitizeExportPrefix('  Épisode / 4  ')).toBe('Episode-4')
    expect(formatKeyframeFilename('Épisode / 4', 3, 12)).toBe('Episode-4-03.png')
  })
})
