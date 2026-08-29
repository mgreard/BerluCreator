import type { EditorGroup } from '@core/types/editor.types'

export interface StagePlacementZIndexes {
  behind: number
  front: number
}

/**
 * Encadre un accessoire autour du mobilier et de tous les personnages.
 * Le z-index reste un ordre de dessin et ne modifie jamais la distance optique.
 */
export function resolveStagePlacementZIndexes(
  deskZIndex: number,
  groups: EditorGroup[]
): StagePlacementZIndexes {
  const references = [
    deskZIndex,
    ...groups.filter((group) => group.kind === 'character').map((group) => group.zIndex)
  ]
  return {
    behind: Math.min(...references) - 1,
    front: Math.max(...references) + 1
  }
}
