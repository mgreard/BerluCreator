import type { VariantProps } from 'class-variance-authority'
import type { mentionContainerVariants } from './variants'

export interface MentionTrigger<T = unknown> {
  /** Caractère déclencheur (ex: '@', '#', ':') */
  char: string
  /** Fonction de recherche synchrone ou asynchrone */
  search(query: string): T[] | Promise<T[]>
  /** Formateur d'insertion dans le texte (ex: (user) => `[user:${user.id}]` ou `@${user.name}`) */
  format(item: T): string
  /** Libellé d'affichage pour la ligne de suggestion par défaut */
  label?(item: T): string
  /** Clé unique de l'élément */
  key?(item: T): string | number
  /** Icône optionnelle associée au déclencheur */
  icon?: string
  /** Autorise les espaces dans la requête active (utile pour les noms composés) */
  allowSpaces?: boolean
}

export interface Token {
  id: string
  label: string
  type: string
  raw: string
}

export interface CaretCoordinates {
  top: number
  left: number
  height: number
}

export type MentionContainerVariants = VariantProps<typeof mentionContainerVariants>

export interface MentionInputProps<T = unknown> {
  /** Liste des déclencheurs de mention */
  triggers?: MentionTrigger<T>[]
  /** Mode multiligne (textarea) ou champ simple (input) */
  multiline?: boolean
  /** Nombre de lignes pour le textarea */
  rows?: number
  /** Texte indicatif */
  placeholder?: string
  /** Affiche une barre de badges / pilules de prévisualisation au-dessus */
  previewBadges?: boolean
  /** Affiche la barre de raccourcis des déclencheurs sous l'éditeur */
  showTriggerButtons?: boolean
  /** Parseur personnalisé pour extraire les tokens et badges */
  badgeParser?: (text: string) => Token[]
  /** État désactivé */
  disabled?: boolean
  /** État en lecture seule */
  readonly?: boolean
  /** État d'erreur ou message d'erreur */
  error?: boolean | string
  /** Identifiant HTML */
  id?: string
  /** Nom du champ de formulaire */
  name?: string
  /** Classes CSS supplémentaires pour le conteneur */
  class?: string
}

export interface MentionInputEmits<T = unknown> {
  (e: 'select', item: T, trigger: MentionTrigger<T>): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
  (e: 'update:modelValue', value: string): void
}
