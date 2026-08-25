export interface CategoryThemeConfig {
  label?: string
  color?: string
  bgColor?: string
  borderColor?: string
  textColor?: string
  iconName?: string
  icon?: string
}

export type CategoryBadgeSize = 'mini' | 'sm' | 'md'
export type CategoryBadgeIconType = 'symbol' | 'emoji' | 'none'
export type CategoryBadgeVariant = 'subtle' | 'solid' | 'outline'

export interface CategoryBadgeProps {
  /** Identifiant ou label de la catégorie */
  category?: string
  /** Surcharge textuelle du label */
  label?: string
  /** Configuration de thème personnalisée (couleurs, icônes) */
  themeConfig?: CategoryThemeConfig
  /** Couleur d'accentuation (ex: '#818cf8', 'purple') */
  color?: string
  /** Couleur d'arrière-plan */
  bgColor?: string
  /** Nom de l'icône Material Symbol */
  iconName?: string
  /** Emoji d'icône */
  icon?: string
  /** Taille du badge : 'mini' | 'sm' | 'md' */
  size?: CategoryBadgeSize
  /** Type d'icône : 'symbol' (Material Symbol), 'emoji', ou 'none' */
  iconType?: CategoryBadgeIconType
  /** Active l'ellipse / troncature : boolean ou largeur personnalisée (ex: '120px', 80) */
  ellipsis?: boolean | string | number
  /** Variante visuelle */
  variant?: CategoryBadgeVariant
  /** Activer le style interactif au survol */
  interactive?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}
