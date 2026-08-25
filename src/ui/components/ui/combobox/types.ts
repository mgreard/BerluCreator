import type { VariantProps } from 'class-variance-authority'
import type { comboboxTriggerVariants } from './variants'

export interface ComboboxOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
}

export type ComboboxSize = 'sm' | 'md' | 'lg'

export type ComboboxTriggerVariants = VariantProps<typeof comboboxTriggerVariants>

export interface ComboboxProps {
  /** Liste complète des options */
  options?: ComboboxOption[]
  /** Placeholder du champ */
  placeholder?: string
  /** Placeholder du champ de recherche */
  searchPlaceholder?: string
  /** Taille du composant */
  size?: ComboboxSize
  /** État désactivé */
  disabled?: boolean
  /** Identifiant HTML */
  id?: string
  /** Nom du formulaire */
  name?: string
  /** Message d'erreur ou statut */
  error?: boolean | string
  /** Seuil pour activer la virtualisation */
  virtualThreshold?: number
  /** Classes CSS additionnelles */
  class?: string
}

export interface ComboboxEmits {
  (e: 'change', value: string | number | null): void
  (e: 'search', term: string): void
  (e: 'update:modelValue', value: string | number | null): void
}
