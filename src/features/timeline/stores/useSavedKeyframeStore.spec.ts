import { describe, expect, it } from 'vitest'
import type { Sequence } from '@core/types/timeline.types'
import { captureVisibleTracks } from './useSavedKeyframeStore'

function sequence(): Sequence {
  return {
    id: 'sequence',
    projectId: 'workspace',
    name: 'Sequence',
    durationMs: 5000,
    fps: 24,
    groups: [
      { id: 'visible-group', name: 'Visible', zIndex: 10 },
      { id: 'muted-group', name: 'Muted', zIndex: 20, muted: true }
    ],
    tracks: [
      {
        id: 'head',
        name: 'Tête',
        category: 'head',
        targetSlot: 'head',
        groupId: 'visible-group',
        zIndex: 1,
        muted: false,
        locked: false,
        keyframes: [
          { id: 'early', timeMs: 0, sprites: [{ id: 'old', assetId: 'asset-old', order: 0 }] },
          {
            id: 'active',
            timeMs: 1000,
            sprites: [
              {
                id: 'active-sprite',
                assetId: 'asset-active',
                transform: { x: 42, scaleX: 1.2 },
                order: 0
              }
            ]
          }
        ]
      },
      {
        id: 'muted-track',
        name: 'Masquée',
        category: 'eyes',
        targetSlot: 'eyes',
        groupId: 'muted-group',
        zIndex: 2,
        muted: false,
        locked: false,
        keyframes: [
          { id: 'hidden', timeMs: 0, sprites: [{ id: 'hidden-sprite', assetId: 'hidden', order: 0 }] }
        ]
      }
    ],
    createdAt: 1,
    updatedAt: 1
  }
}

describe('captureVisibleTracks', () => {
  it('capture uniquement la pose visible active avec ses transformations', () => {
    const tracks = captureVisibleTracks(sequence(), 1500)

    expect(tracks).toHaveLength(1)
    expect(tracks[0]).toMatchObject({
      sourceTrackId: 'head',
      sourceGroupId: 'visible-group',
      sprites: [{ assetId: 'asset-active', transform: { x: 42, scaleX: 1.2 }, order: 0 }]
    })
  })
})
