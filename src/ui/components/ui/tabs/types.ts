export interface TabItem {
  key: string | number
  label: string
  icon?: string
  badge?: string | number
  disabled?: boolean
  content?: string
}

export type TabsVariant = 'capsule' | 'segmented' | 'underline'
export type TabsSize = 'sm' | 'md'

export interface TabsProps {
  /** Liste des onglets */
  tabs?: TabItem[]
  /** Variante visuelle */
  variant?: TabsVariant
  /** Mode d'activation clavier : automatique (par défaut) ou manuel (Space/Enter) */
  activationMode?: 'automatic' | 'manual'
  /** Taille */
  size?: TabsSize
  /** Classes CSS supplémentaires */
  class?: string
}

export interface TabsEmits {
  (e: 'change', key: string | number): void
  (e: 'update:modelValue', key: string | number): void
}
