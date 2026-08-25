export type DropdownMenuAlign = 'start' | 'center' | 'end'
export type DropdownMenuSide = 'top' | 'right' | 'bottom' | 'left'
export type DropdownMenuWidth = 'auto' | 'sm' | 'md' | 'lg' | 'trigger' | string
export type DropdownMenuSurface = 'solid' | 'glass'

export interface DropdownMenuItemDef {
  /** Identifiant unique de l'action */
  id?: string
  /** Libellé principal */
  label?: string
  /** Icône décorative (nom Material Symbols ou caractère) */
  icon?: string
  /** Raccourci clavier indicatif (ex: ⌘K, Ctrl+S) */
  shortcut?: string
  /** Type d'élément dans le menu */
  type?: 'item' | 'checkbox' | 'radio' | 'label' | 'separator'
  /** État sélectionné pour les types checkbox */
  checked?: boolean
  /** Valeur pour les types radio */
  value?: string
  /** Action destructive (affichée en rouge) */
  destructive?: boolean
  /** Désactive l'élément */
  disabled?: boolean
  /** Sous-menu déroulant en cascade */
  children?: DropdownMenuItemDef[]
  /** Fonction de rappel exécutée au clic */
  onClick?: (item: DropdownMenuItemDef) => void
}

export interface DropdownMenuProps {
  /** Liste déclarative d'éléments de menu */
  items?: DropdownMenuItemDef[]
  /** Alignement par rapport au déclencheur */
  align?: DropdownMenuAlign
  /** Côté d'affichage par rapport au déclencheur */
  side?: DropdownMenuSide
  /** Décalage en pixels par rapport au déclencheur */
  sideOffset?: number
  /** Décalage d'alignement en pixels */
  alignOffset?: number
  /** Largeur du menu */
  width?: DropdownMenuWidth
  /** Traitement visuel de la surface (`solid` par défaut, `glass` en opt-in) */
  surface?: DropdownMenuSurface
  /** Modalité : bloque les clics hors du menu */
  modal?: boolean
  /** Téléporte le menu dans un portail document.body */
  portal?: boolean
  /** Affiche une flèche pointant vers le déclencheur */
  arrow?: boolean
  /** Désactive le déclencheur */
  disabled?: boolean
  /** Classes CSS supplémentaires pour le conteneur de contenu */
  class?: string
}

export interface DropdownMenuEmits {
  (e: 'select', item: DropdownMenuItemDef): void
  (e: 'update:open', open: boolean): void
}
