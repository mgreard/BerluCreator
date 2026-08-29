import { describe, expect, it } from 'vitest'
import type { EditorGroup } from '@core/types/editor.types'
import { resolveStagePlacementZIndexes } from './stage-layer-placement'

const character = (id: string, zIndex: number): EditorGroup => ({
  id,
  name: id,
  kind: 'character',
  characterKey: id,
  activeMode: 'rig',
  zIndex,
  transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
  muted: false,
  locked: false,
  collapsed: false,
  color: 'indigo',
  allowedCategories: [],
  isDefault: false
})

describe('resolveStagePlacementZIndexes', () => {
  it('place Derrière sous le bureau et tous les personnages', () => {
    expect(resolveStagePlacementZIndexes(28, [character('berlu', 20), character('pedro', 24)]))
      .toEqual({ behind: 19, front: 29 })
  })

  it('place Devant au-dessus d’un personnage plus avancé que le bureau', () => {
    expect(resolveStagePlacementZIndexes(28, [character('guest', 42)])).toEqual({
      behind: 27,
      front: 43
    })
  })
})
