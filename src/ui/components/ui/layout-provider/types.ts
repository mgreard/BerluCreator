import type { Component } from 'vue'

export type LayoutType = 'dashboard' | 'auth' | 'default' | string

export interface LayoutProviderProps {
  /** Nom du layout ou composant de layout actif */
  layout?: LayoutType | Component
}
