import type { PageLayoutMode, PageLayoutMaxWidth } from '@/components/ui/page-layout'

export interface DashboardLayoutProps {
  /** Titre de la marque */
  brandTitle?: string
  /** Icône de la marque */
  brandIcon?: string
  /** Mode de page (scroll naturel ou fill) */
  mode?: PageLayoutMode
  /** Largeur maximale du contenu */
  maxWidth?: PageLayoutMaxWidth
  /** Classes CSS supplémentaires */
  class?: string
}

export interface DashboardLayoutEmits {
  (e: 'update:sidebarOpen', value: boolean): void
}
