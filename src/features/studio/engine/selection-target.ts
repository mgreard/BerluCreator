import { ASSET_CATEGORIES } from '@core/constants/categories'
import type { AssetCategory } from '@core/types/asset.types'

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
 * Les pièces d'un personnage sont toujours manipulées via leur groupe afin que le rig
 * reste indivisible. Les assets de plateau restent manipulables individuellement.
 */
export function shouldTargetWholeGroup(
  groupId: string | undefined,
  category: AssetCategory | undefined,
  editScope: 'group' | 'layer' = 'layer',
  shiftKey = false
): boolean {
  if (!groupId) return false

  const isCharacterAsset = category
    ? ASSET_CATEGORIES[category].placementMode === 'character-anchored'
    : false
  return isCharacterAsset || editScope === 'group' || shiftKey
}
