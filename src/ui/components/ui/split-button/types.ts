export type SplitButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'destructive'
export type SplitButtonSize = 'sm' | 'md' | 'lg'
export type SplitButtonShape = 'pill' | 'rounded'

export interface SplitButtonItem {
  /** Clé unique de l'action */
  key: string | number
  /** Libellé affiché */
  label: string
  /** Icône ou emoji optionnel */
  icon?: string
  /** Action désactivée */
  disabled?: boolean
  /** Action destructive */
  destructive?: boolean
}

export interface SplitButtonProps {
  /** Libellé du bouton principal si le slot par défaut n'est pas utilisé */
  label?: string
  /** Liste des actions secondaires du menu déroulant (recommandé < 5) */
  items?: SplitButtonItem[]
  /** Variante visuelle */
  variant?: SplitButtonVariant
  /** Taille du bouton combiné */
  size?: SplitButtonSize
  /** Forme des coins */
  shape?: SplitButtonShape
  /** État désactivé global */
  disabled?: boolean
  /** État de chargement */
  loading?: boolean
  /** Texte dynamique d'état pendant le chargement */
  loadingText?: string
  /** Libellé accessible du déclencheur de menu */
  menuAriaLabel?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface SplitButtonEmits {
  (e: 'click', event: MouseEvent): void
  (e: 'select', item: SplitButtonItem): void
}
