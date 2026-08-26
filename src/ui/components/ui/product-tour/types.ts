import type { Config, DriveStep } from 'driver.js'

export type ProductTourStep = DriveStep

export interface ProductTourProps {
  /** Étapes Driver.js affichées dans l’ordre. */
  steps: ProductTourStep[]
  /** Lance automatiquement la visite si elle n’a pas encore été vue. */
  autoStart?: boolean
  /** Clé locale utilisée pour mémoriser la première visite. */
  storageKey?: string
  /** Délai avant le lancement automatique, pour laisser l’interface se monter. */
  startDelayMs?: number
  /** Options Driver.js additionnelles. */
  config?: Omit<Config, 'steps'>
}

export interface ProductTourEmits {
  (event: 'started'): void
  (event: 'finished'): void
}

export interface ProductTourExpose {
  start: (stepIndex?: number) => void
  reset: () => void
}
