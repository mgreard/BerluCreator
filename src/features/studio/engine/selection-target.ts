import { ASSET_CATEGORIES } from '@core/constants/categories'
import type { AssetCategory } from '@core/types/asset.types'

/**
 * Détermine si la sélection ou la manipulation sur le canvas doit cibler le groupe parent
 * plutôt que le calque individuel.
 *
 * Règle d'or : Les catégories appartenant au personnage (placementMode: 'character-anchored',
 * comme la tête, la bouche, les yeux, le torse ou les bras de Berlu) sont TOUJOURS manipulées
 * solidairement au niveau du groupe pour préserver l'intégrité anatomique de l'avatar.
 */
export function shouldTargetWholeGroup(
  groupId: string | undefined,
  category: AssetCategory | undefined,
  editScope: 'group' | 'layer' = 'layer',
  shiftKey = false
): boolean {
  if (!groupId) return false

  if (category && ASSET_CATEGORIES[category]?.placementMode === 'character-anchored') {
    return true
  }

  return editScope === 'group' || shiftKey
}
