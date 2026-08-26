import { describe, expect, it } from 'vitest'
import type { TimelineTrack } from '@core/types/timeline.types'
import {
  findAssetTargetTrack,
  resolveAssetAssignmentTime
} from './asset-timeline-assignment'

function createTrack(
  id: string,
  category: TimelineTrack['category'],
  keyframes: TimelineTrack['keyframes'] = [],
  groupId?: string
): TimelineTrack {
  return {
    id,
    name: id,
    category,
    targetSlot: category,
    groupId,
    zIndex: 0,
    muted: false,
    locked: false,
    keyframes
  }
}

describe('asset timeline assignment', () => {
  it('prioritizes the selected matching track', () => {
    const firstHeadTrack = createTrack('head-1', 'head')
    const selectedHeadTrack = createTrack('head-2', 'head')

    expect(
      findAssetTargetTrack([firstHeadTrack, selectedHeadTrack], selectedHeadTrack, 'head')
    ).toBe(selectedHeadTrack)
  })

  it('falls back to the first matching track when the selection has another category', () => {
    const headTrack = createTrack('head', 'head')
    const mouthTrack = createTrack('mouth', 'mouth')

    expect(findAssetTargetTrack([headTrack, mouthTrack], mouthTrack, 'head')).toBe(headTrack)
  })

  it('prioritizes a matching track inside the active group', () => {
    const defaultTrack = createTrack('head-default', 'head', [], 'group-default')
    const targetTrack = createTrack('head-target', 'head', [], 'group-target')

    expect(
      findAssetTargetTrack(
        [defaultTrack, targetTrack],
        defaultTrack,
        'head',
        'group-target'
      )
    ).toBe(targetTrack)
  })

  it('does not fall back outside the active group', () => {
    const defaultTrack = createTrack('head-default', 'head', [], 'group-default')

    expect(
      findAssetTargetTrack([defaultTrack], defaultTrack, 'head', 'group-target')
    ).toBeUndefined()
  })

  it('uses the exact time of the selected keyframe on the selected track', () => {
    const selectedTrack = createTrack('head', 'head', [
      {
        id: 'keyframe-1',
        timeMs: 1_275,
        sprites: [{ id: 'sprite-1', assetId: 'asset-old', order: 0 }]
      }
    ])

    expect(resolveAssetAssignmentTime(selectedTrack, selectedTrack, 'keyframe-1', 1_300)).toBe(
      1_275
    )
  })

  it('uses the playback time when no keyframe is selected on the target track', () => {
    const targetTrack = createTrack('head', 'head')
    const selectedTrack = createTrack('mouth', 'mouth', [
      {
        id: 'keyframe-1',
        timeMs: 1_275,
        sprites: [{ id: 'sprite-1', assetId: 'asset-old', order: 0 }]
      }
    ])

    expect(resolveAssetAssignmentTime(targetTrack, selectedTrack, 'keyframe-1', 1_300)).toBe(
      1_300
    )
  })
})
