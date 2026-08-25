export type SubtypeBadgeSize = 'mini' | 'sm' | 'md'
export type SubtypeBadgeVariant = 'neutral' | 'subtle' | 'outline'

export interface SubtypeBadgeProps {
  /** Texte du sous-type (ex: "Elfe Sylvain", "Vaisseau", "Costume", etc.) */
  subType?: string
  /** Alias pour le texte */
  text?: string
  /** Taille du badge : 'mini' | 'sm' | 'md' */
  size?: SubtypeBadgeSize
  /** Active l'ellipse / troncature : boolean (défaut 100px) ou largeur personnalisée (ex: '120px', 80) */
  ellipsis?: boolean | string | number
  /** Catégorie parente optionnelle pour teinter subtilement le sous-type */
  category?: string
  /** Variante visuelle : 'neutral' | 'subtle' | 'outline' */
  variant?: SubtypeBadgeVariant
  /** Classes CSS supplémentaires */
  class?: string
}
