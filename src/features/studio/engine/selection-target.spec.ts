import { describe, expect, it } from 'vitest'
import { shouldTargetWholeGroup } from './selection-target'

describe('canvas selection target', () => {
  it('always targets the whole group for character-anchored categories', () => {
    expect(shouldTargetWholeGroup('grp_berlu', 'head', 'layer', false)).toBe(true)
    expect(shouldTargetWholeGroup('grp_berlu', 'torso', 'layer', false)).toBe(true)
    expect(shouldTargetWholeGroup('grp_berlu', 'arms_left', 'layer', false)).toBe(true)
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
})
