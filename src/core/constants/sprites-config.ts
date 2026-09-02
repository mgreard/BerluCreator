import type { SpritesConfigFile, AssetCategory, SpriteConfigRule } from '../types/asset.types'
import { ASSET_CATEGORIES } from './categories'

/**
 * Fichier de configuration déclarative des sprites.
 * Permet de définir les règles de mobilité (isMovable), de profondeur (Z-Index)
 * et de placement pour chaque catégorie ou sprite spécifique.
 */
export const SPRITES_CONFIG: SpritesConfigFile = {
  categoryDefaults: {
    background: { isMovable: false, defaultZIndex: 0 },
    background_overlay: { isMovable: false, defaultZIndex: 5 },
    perso: { isMovable: false, defaultZIndex: 10 },
    body: { isMovable: false, defaultZIndex: 10 },
    head: { isMovable: false, defaultZIndex: 20 },
    mouth: { isMovable: false, defaultZIndex: 22 },
    props_character: { isMovable: false, defaultZIndex: 24 },
    props_set: { isMovable: true, defaultZIndex: 30 },
    desk: { isMovable: true, defaultZIndex: 10 },
    props_desk: { isMovable: true, defaultZIndex: 30 },
    foreground: { isMovable: true, defaultZIndex: 50 }
  },

  rules: [
    // Bureau du plateau, manipulable directement dans le viewport
    {
      pattern: 'bureau|desk|plateau_fond',
      category: 'desk',
      isMovable: true,
      defaultZIndex: 28
    },
    // Accessoires déplaçables tenus ou posés
    {
      pattern: 'micro|fiches|journal|tasse|mug|stylo|phone|lunettes|chapeau',
      category: 'props_set',
      isMovable: true,
      defaultZIndex: 35
    },
    // Éléments de titrage / synthés déplaçables
    {
      pattern: 'synthe|breaking_news|ticker|logo',
      category: 'foreground',
      isMovable: true,
      defaultZIndex: 50
    }
  ]
}

/**
 * Résout la configuration finale pour un sprite donné (par nom et catégorie).
 */
export function resolveSpriteConfig(name: string, category: AssetCategory): {
  isMovable: boolean
  defaultZIndex: number
  rule?: SpriteConfigRule
} {
  const normalizedName = name.toLowerCase()

  // 1. Chercher une règle de surcharge spécifique
  for (const rule of SPRITES_CONFIG.rules) {
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern, 'i')
      if (regex.test(normalizedName)) {
        return {
          isMovable: rule.isMovable ?? SPRITES_CONFIG.categoryDefaults[category]?.isMovable ?? true,
          defaultZIndex:
            rule.defaultZIndex ??
            SPRITES_CONFIG.categoryDefaults[category]?.defaultZIndex ??
            ASSET_CATEGORIES[category]?.defaultZIndex ??
            10,
          rule
        }
      }
    }
  }

  // 2. Fallback sur la catégorie
  const categoryConfig = SPRITES_CONFIG.categoryDefaults[category]
  return {
    isMovable: categoryConfig?.isMovable ?? true,
    defaultZIndex: categoryConfig?.defaultZIndex ?? 10
  }
}
