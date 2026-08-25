export type AlertDialogVariant = 'danger' | 'warning' | 'info' | 'primary'

export interface AlertDialogProps {
  /** Titre de la boîte de dialogue */
  title: string
  /** Description ou avertissement explicatif */
  description?: string
  /** Variante sémantique (danger, warning, info, primary) */
  variant?: AlertDialogVariant
  /** Libellé du bouton de confirmation */
  confirmText?: string
  /** Libellé du bouton d'annulation */
  cancelText?: string
  /** Icône d'en-tête */
  icon?: string
  /** État de chargement sur l'action de confirmation */
  confirmLoading?: boolean
  /** Désactive le bouton de confirmation */
  confirmDisabled?: boolean
  /** Texte exact requis que l'utilisateur doit saisir pour débloquer l'action (ex: 'SUPPRIMER') */
  requireConfirmationText?: string
  /** Classes CSS supplémentaires */
  class?: string
}

export interface AlertDialogEmits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}
