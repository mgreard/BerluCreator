export type TabTone =
  | 'neutral'
  | 'indigo'
  | 'sky'
  | 'amber'
  | 'rose'
  | 'red'
  | 'cyan'
  | 'emerald'
  | 'lime'
  | 'purple'
  | 'yellow'

export interface TabItem {
  key: string | number
  label: string
  icon?: string
  badge?: string | number
  tone?: TabTone
  disabled?: boolean
  content?: string
}

export type TabsVariant = 'capsule' | 'segmented' | 'underline' | 'rail'
export type TabsSize = 'sm' | 'md'
export type TabsOrientation = 'horizontal' | 'vertical'

export interface TabsProps {
  /** Liste des onglets */
  tabs?: TabItem[]
  /** Variante visuelle */
  variant?: TabsVariant
  /** Mode d'activation clavier : automatique (par défaut) ou manuel (Space/Enter) */
  activationMode?: 'automatic' | 'manual'
  /** Taille */
  size?: TabsSize
  /** Axe de navigation et comportement des flèches clavier */
  orientation?: TabsOrientation
  /** Libellé accessible de la liste d'onglets */
  ariaLabel?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface TabsEmits {
  (e: 'change', key: string | number): void
  (e: 'update:modelValue', key: string | number): void
}
