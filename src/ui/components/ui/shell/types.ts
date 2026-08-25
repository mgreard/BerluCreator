export interface ShellProps {
  /** Permet de replier la sidebar en mode mini */
  collapsible?: boolean
  /** Titre ou marque pour l'en-tête */
  brandTitle?: string
  /** Logo ou icône de marque */
  brandIcon?: string
  /** Classes CSS supplémentaires pour la racine */
  class?: string
}

export interface ShellEmits {
  (e: 'toggle-sidebar', isOpen: boolean): void
  (e: 'update:sidebarOpen', value: boolean): void
}
