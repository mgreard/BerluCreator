import { describe, expect, it } from 'vitest'
import type { TimelineTrack } from '@core/types/timeline.types'
import {
  findAssetTargetTrack,
  resolveAssetAssignmentStep
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

  it('utilise l’étape exacte de la keyframe sélectionnée sur la piste', () => {
    const selectedTrack = createTrack('head', 'head', [
      {
        id: 'keyframe-1',
        stepId: 'step-1',
        sprites: [{ id: 'sprite-1', assetId: 'asset-old', order: 0 }]
      }
    ])

    expect(resolveAssetAssignmentStep(selectedTrack, selectedTrack, 'keyframe-1', 'step-2')).toBe('step-1')
  })

  it('utilise l’étape active quand la keyframe appartient à une autre piste', () => {
    const targetTrack = createTrack('head', 'head')
    const selectedTrack = createTrack('mouth', 'mouth', [
      {
        id: 'keyframe-1',
        stepId: 'step-1',
        sprites: [{ id: 'sprite-1', assetId: 'asset-old', order: 0 }]
      }
    ])

    expect(resolveAssetAssignmentStep(targetTrack, selectedTrack, 'keyframe-1', 'step-2')).toBe('step-2')
  })
})
