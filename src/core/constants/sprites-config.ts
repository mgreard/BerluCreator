import type { SpritesConfigFile, AssetCategory, SpriteConfigRule } from '../types/asset.types'

/**
 * Fichier de configuration déclarative des sprites.
 * Permet de définir les règles de mobilité (isMovable), de profondeur (Z-Index)
 * et de placement pour chaque catégorie ou sprite spécifique.
 */
export const SPRITES_CONFIG: SpritesConfigFile = {
  categoryDefaults: {
    background: { isMovable: false, defaultZIndex: 0 },
    torso: { isMovable: false, defaultZIndex: 10 },
    head: { isMovable: false, defaultZIndex: 20 },
    mouth: { isMovable: false, defaultZIndex: 25 },
    eyes: { isMovable: false, defaultZIndex: 24 },
    arms_left: { isMovable: false, defaultZIndex: 12 },
    arms_right: { isMovable: false, defaultZIndex: 15 },
    props_host: { isMovable: true, defaultZIndex: 30 },
    props_set: { isMovable: true, defaultZIndex: 30 },
    desk: { isMovable: false, defaultZIndex: 10 },
    props_desk: { isMovable: true, defaultZIndex: 30 },
    foreground: { isMovable: true, defaultZIndex: 50 }
  },

  rules: [
    // Décor fixe du plateau (Desk / Bureau / Fond)
    {
      pattern: 'bureau|desk|plateau_fond',
      category: 'desk',
      isMovable: false,
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
        const defaults = SPRITES_CONFIG.categoryDefaults[category] || { isMovable: false, defaultZIndex: 10 }
        return {
          isMovable: rule.isMovable ?? defaults.isMovable,
          defaultZIndex: rule.defaultZIndex ?? defaults.defaultZIndex,
          rule
        }
      }
    }
  }

  // 2. Fallback sur les valeurs par défaut de la catégorie
  const catDefault = SPRITES_CONFIG.categoryDefaults[category] ?? { isMovable: false, defaultZIndex: 10 }
  return {
    isMovable: catDefault.isMovable,
    defaultZIndex: catDefault.defaultZIndex
  }
}
