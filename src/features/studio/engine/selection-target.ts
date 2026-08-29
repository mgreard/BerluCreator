import type { EditorGroup } from '@core/types/editor.types'

export interface StudioSelectionTarget {
  selectedLayerId: string | null
  selectedGroupId: string | null
  editScope: 'group' | 'layer'
}

export interface CanvasHitTarget {
  layerId: string
  groupId?: string
}

/**
 * Indique si un calque touché appartient à la sélection actuellement manipulée.
 * Un personnage est comparé par groupe, car son sprite complet ou ses pièces de rig
 * partagent une unique cible de transformation.
 */
export function isActiveSelectionHit(
  selection: StudioSelectionTarget,
  hit: CanvasHitTarget
): boolean {
  if (selection.editScope === 'group') {
    return Boolean(hit.groupId && hit.groupId === selection.selectedGroupId)
  }

  return hit.layerId === selection.selectedLayerId
}

/**
 * Seuls les personnages sont manipulés via leur groupe afin que leur sprite complet ou
 * leur rig reste indivisible. Un groupe de plateau n'est jamais une cible de sélection.
 */
export function shouldTargetWholeGroup(
  groupKind: EditorGroup['kind'] | undefined
): boolean {
  return groupKind === 'character'
}
