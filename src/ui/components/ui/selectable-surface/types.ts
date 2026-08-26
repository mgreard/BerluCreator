import type { Component, HTMLAttributes } from 'vue'

export type SelectableSurfaceRole = 'button' | 'option' | 'radio' | 'treeitem'
export type SelectableSurfaceDensity = 'default' | 'compact'

export interface SelectableSurfaceProps {
  /** Balise ou composant rendu par la primitive. */
  as?: string | Component
  /** État de sélection communiqué aux technologies d'assistance. */
  selected?: boolean
  /** Désactive le focus et les interactions. */
  disabled?: boolean
  /** Sémantique portée par la surface. */
  role?: SelectableSurfaceRole
  /** Densité visuelle ; compact conserve une cible tactile virtuelle de 44 px. */
  density?: SelectableSurfaceDensity
  /** Classes CSS applicatives. */
  class?: HTMLAttributes['class']
}

export interface SelectableSurfaceEmits {
  (event: 'click', payload: MouseEvent | KeyboardEvent): void
}
