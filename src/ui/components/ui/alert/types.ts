export type AlertVariant = 'info' | 'success' | 'warning' | 'danger'

export interface AlertProps {
  /** Variante d'état */
  variant?: AlertVariant
  /** Titre de l'alerte */
  title?: string
  /** Rendre l'alerte fermable */
  dismissible?: boolean
  /** Afficher l'icône */
  showIcon?: boolean
  /** Nom d'icône ou texte personnalisé */
  iconName?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface AlertEmits {
  (e: 'dismiss'): void
}
