export interface FormGroupProps {
  /** Libellé du champ */
  label?: string
  /** Attribut for du label */
  labelFor?: string
  /** Marquer comme obligatoire (*) */
  required?: boolean
  /** Erreur ou booléen d'erreur */
  error?: string | boolean
  /** Texte d'aide sous le champ */
  helperText?: string
  /** État désactivé */
  disabled?: boolean
  /** Disposition en ligne */
  inline?: boolean
  /** Classes CSS supplémentaires */
  class?: string
}
