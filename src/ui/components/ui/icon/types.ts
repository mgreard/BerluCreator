export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string

export interface IconProps {
  /** Nom de l'icône Material Symbol (ex: 'search', 'home', 'settings') */
  name: string
  /** Taille de l'icône par mot-clé ou valeur CSS */
  size?: IconSize
  /** Remplissage plein */
  filled?: boolean
  /** Couleur spécifique (par défaut currentColor) */
  color?: string
  /** Classes CSS supplémentaires */
  class?: string
}
