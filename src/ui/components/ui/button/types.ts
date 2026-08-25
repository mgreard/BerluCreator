import type { Component } from 'vue'
import type { VariantProps } from 'class-variance-authority'
import type { buttonVariants } from './variants'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'accent'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonShape = 'pill' | 'rounded'
export type ButtonType = 'button' | 'submit' | 'reset'
export type ButtonVariants = VariantProps<typeof buttonVariants>

export interface ButtonProps {
  /** Variante visuelle */
  variant?: ButtonVariant
  /** Taille du bouton */
  size?: ButtonSize
  /** Forme des coins */
  shape?: ButtonShape
  /** État actif (sélectionné / pressé) */
  active?: boolean
  /** État désactivé */
  disabled?: boolean
  /** État de chargement */
  loading?: boolean
  /** Texte dynamique d'état pendant le chargement (ex: "Enregistrement...") */
  loadingText?: string
  /** Type HTML du bouton */
  type?: ButtonType
  /** Cible de navigation router-link */
  to?: string | Record<string, unknown>
  /** Lien hypertexte natif */
  href?: string
  /** Balise ou composant personnalisé */
  as?: string | Component
  /** Rendu headless délégué à l'élément enfant */
  asChild?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}

export interface ButtonEmits {
  (e: 'click', event: MouseEvent): void
}
