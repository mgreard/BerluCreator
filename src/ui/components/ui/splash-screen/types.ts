export interface SplashScreenProps {
  /**
   * Visibilité / état actif du splash screen.
   * Si true, le splash screen est affiché. S'il passe à false, il s'estompe avec une transition douce.
   * @default true
   */
  isLoading?: boolean

  /**
   * Message de statut affiché sous le logo.
   * @default 'Chargement du studio...'
   */
  statusMessage?: string

  /**
   * Pourcentage d'avancement optionnel (0 à 100).
   * Si non renseigné ou undefined, la barre tourne en mode indéterminé / shimmer.
   */
  progress?: number

  /**
   * Afficher ou masquer la barre de progression.
   * @default true
   */
  showProgress?: boolean

  /**
   * Durée minimale d'affichage (en ms) pour éviter tout effet de flash lors des chargements très rapides.
   * @default 1000
   */
  minDurationMs?: number

  /**
   * Classes CSS additionnelles pour le conteneur racine.
   */
  class?: string
}

export interface SplashScreenEmits {
  /**
   * Déclenché lorsque l'animation de sortie s'est totalement terminée et que le splash screen est démonté.
   */
  (e: 'completed'): void
}
