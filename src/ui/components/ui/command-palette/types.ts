import type { VariantProps } from 'class-variance-authority'
import type { commandPaletteContentVariants } from './variants'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  onSelect?: () => void
}

export interface CommandGroup {
  name: string
  items: CommandItem[]
}

export type CommandPaletteSize = 'sm' | 'md' | 'lg'
export type CommandPaletteContentVariants = VariantProps<typeof commandPaletteContentVariants>

export interface CommandPaletteProps {
  /** Groupes de commandes et d'actions */
  groups?: CommandGroup[]
  /** Liste plate d'actions si pas de groupement */
  items?: CommandItem[]
  /** Texte indicatif dans la barre de recherche */
  placeholder?: string
  /** Active l'écouteur global de raccourci clavier (⌘K / Ctrl+K) */
  enableShortcut?: boolean
  /** Taille de la palette */
  size?: CommandPaletteSize
  /** Classes CSS supplémentaires */
  class?: string
}

export interface CommandPaletteEmits {
  (e: 'select', item: CommandItem): void
  (e: 'update:open', value: boolean): void
}
