export interface AccordionItemData {
  value: string
  title: string
  subtitle?: string
  icon?: string
  badge?: string | number
  disabled?: boolean
  content?: string
}

export type AccordionType = 'single' | 'multiple'
export type AccordionVariant = 'default' | 'card' | 'bordered'

export interface AccordionProps {
  /** Liste des éléments de l'accordéon */
  items?: AccordionItemData[]
  /** Mode d'ouverture : 'single' (un seul volet) ou 'multiple' (plusieurs volets indépendants) */
  type?: AccordionType
  /** Permet de refermer l'élément actif en mode 'single' */
  collapsible?: boolean
  /** État désactivé global */
  disabled?: boolean
  /** Variante visuelle */
  variant?: AccordionVariant
  /** Classes CSS supplémentaires */
  class?: string
}

export interface AccordionEmits {
  (e: 'change', value: string | string[] | undefined): void
  (e: 'update:modelValue', value: string | string[] | undefined): void
}
