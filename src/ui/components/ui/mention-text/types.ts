import type { Component, StyleValue } from 'vue'

export type MentionColorVariant =
  'purple' | 'amber' | 'emerald' | 'sky' | 'rose' | 'indigo' | 'neutral'

export type MentionChipSize = 'sm' | 'md'

export type MentionVariant = 'text' | 'pill'

export interface MentionChipProps {
  /** Variante de rendu (texte coloré ou pilule) */
  variant?: MentionVariant
  /** Identifiant unique de l'entité mentionnée */
  id?: string | number
  /** Libellé affiché de la mention */
  label: string
  /** Catégorie ou type d'entité */
  category?: string
  /** Variante visuelle de couleur */
  color?: MentionColorVariant
  /** Nom de l'icône Material Symbol */
  icon?: string
  /** Taille de la puce */
  size?: MentionChipSize
  /** Rendre la puce interactive (cliquable) */
  interactive?: boolean
  /** Classes CSS supplémentaires */
  class?: string
  /** Styles inline complémentaires, notamment pour les palettes dynamiques */
  style?: StyleValue
}

export interface MentionChipEmits {
  (
    e: 'click',
    payload: { id?: string | number; label: string; category?: string; event: MouseEvent }
  ): void
}

export interface MentionCategoryDef {
  /** Clé unique de la catégorie */
  key?: string
  /** Libellé explicite */
  label?: string
  /** Variante de couleur */
  color?: MentionColorVariant
  /** Nom de l'icône Material Symbol */
  icon?: string
}

export interface MentionTextProps {
  /** Variante visuelle par défaut des mentions */
  variant?: MentionVariant
  /** Texte brut contenant les mentions au format standard @[type:id|Label] */
  text: string
  /** Dictionnaire des catégories configurées */
  categories?: Record<string, MentionCategoryDef>
  /** Balise ou composant racine */
  as?: string | Component
  /** Rendre les puces cliquables */
  interactive?: boolean
  /** Parseur optionnel pour accepter un format de token externe */
  parser?: (text: string) => MentionTextSegment[]
  /** Taille des puces rendues */
  size?: MentionChipSize
  /** Chaîne de recherche à surligner dans les fragments de texte */
  highlightQuery?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface MentionTextPlainSegment {
  type: 'text'
  value: string
}

export interface MentionTextMentionSegment {
  type: 'mention'
  id: string | number
  label: string
  category?: string
  color?: MentionColorVariant
  icon?: string
  variant?: MentionVariant
  style?: StyleValue
}

export type MentionTextSegment = MentionTextPlainSegment | MentionTextMentionSegment

export interface MentionClickPayload {
  id: string
  type: string
  label: string
  event: MouseEvent
}

export interface MentionTextEmits {
  (e: 'mention-click', payload: MentionClickPayload): void
}
