import type { Component, HTMLAttributes, VNode } from 'vue'

export type NavigationItemDensity = 'default' | 'compact'

export interface NavigationItemProps {
  /** Élément ou composant rendu par la surface interactive. */
  as?: string | Component
  /** Libellé principal de la ligne. */
  label: string
  /** Nom d’une icône Material Symbol. */
  icon?: string
  /** Compteur optionnel affiché à droite. */
  count?: string | number
  /** État actif de la ligne. */
  selected?: boolean
  /** Désactive les interactions. */
  disabled?: boolean
  /** Densité visuelle fondée sur les tokens d’espacement. */
  density?: NavigationItemDensity
  /** Couleur d’accent appliquée à l’icône et à l’état actif. */
  accent?: string
  /** Classes CSS additionnelles. */
  class?: HTMLAttributes['class']
}

export interface NavigationItemEmits {
  (event: 'click', payload: MouseEvent | KeyboardEvent): void
}

export interface NavigationItemSlots {
  prefix?: () => VNode[]
  icon?: () => VNode[]
  trailing?: () => VNode[]
}
