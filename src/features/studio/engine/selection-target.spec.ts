import { describe, expect, it } from 'vitest'
import { isActiveSelectionHit, shouldTargetWholeGroup } from './selection-target'

describe('canvas selection target', () => {
  it('targets the whole character for every full or rig sprite', () => {
    expect(shouldTargetWholeGroup('character-1', 'head', 'layer', false)).toBe(true)
    expect(shouldTargetWholeGroup('character-1', 'body', 'layer', false)).toBe(true)
    expect(shouldTargetWholeGroup('character-1', 'character_full', 'layer', false)).toBe(true)
    expect(shouldTargetWholeGroup('character-1', 'arms_left', 'layer', false)).toBe(true)
  })

  it('keeps the parent group as target while whole-group mode is active', () => {
    expect(shouldTargetWholeGroup('group-1', 'props_set', 'group', false)).toBe(true)
  })

  it('keeps shift-click as an explicit group-selection shortcut', () => {
    expect(shouldTargetWholeGroup('group-1', 'props_set', 'layer', true)).toBe(true)
  })

  it('targets the sprite in layer mode without shift for free-transform elements', () => {
    expect(shouldTargetWholeGroup('group-1', 'props_set', 'layer', false)).toBe(false)
    expect(shouldTargetWholeGroup(undefined, 'props_set', 'group', false)).toBe(false)
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
