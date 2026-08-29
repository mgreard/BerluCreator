import { describe, expect, it } from 'vitest'
import { isActiveSelectionHit, shouldTargetWholeGroup } from './selection-target'

describe('canvas selection target', () => {
  it('targets every hit belonging to a character group as one indivisible selection', () => {
    expect(shouldTargetWholeGroup('character')).toBe(true)
  })

  it('never targets a stage group as a whole', () => {
    expect(shouldTargetWholeGroup('stage')).toBe(false)
    expect(shouldTargetWholeGroup(undefined)).toBe(false)
  })

  it('recognizes the selected free sprite by its layer', () => {
    const selection = {
      selectedLayerId: 'layer-1',
      selectedGroupId: 'group-1',
      editScope: 'layer' as const
    }

    expect(isActiveSelectionHit(selection, { layerId: 'layer-1', groupId: 'group-1' })).toBe(true)
    expect(isActiveSelectionHit(selection, { layerId: 'layer-2', groupId: 'group-1' })).toBe(false)
  })

  it('recognizes every rendered part of the selected character group', () => {
    const selection = {
      selectedLayerId: null,
      selectedGroupId: 'character-1',
      editScope: 'group' as const
    }

    expect(
      isActiveSelectionHit(selection, { layerId: 'left-arm', groupId: 'character-1' })
    ).toBe(true)
    expect(
      isActiveSelectionHit(selection, { layerId: 'left-arm', groupId: 'character-2' })
    ).toBe(false)
  })
})
