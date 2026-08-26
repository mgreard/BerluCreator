import { describe, expect, it } from 'vitest'
import { shouldTargetWholeGroup } from './selection-target'

describe('canvas selection target', () => {
  it('keeps the parent group as target while whole-group mode is active', () => {
    expect(shouldTargetWholeGroup('group-1', 'group', false)).toBe(true)
  })

  it('keeps shift-click as an explicit group-selection shortcut', () => {
    expect(shouldTargetWholeGroup('group-1', 'layer', true)).toBe(true)
  })

  it('targets the sprite in layer mode without shift', () => {
    expect(shouldTargetWholeGroup('group-1', 'layer', false)).toBe(false)
    expect(shouldTargetWholeGroup(undefined, 'group', false)).toBe(false)
  })
})
