---
trigger: always_on
---

---
name: component-design-rules
description: Règles d'or pour la conception, la réactivité (Vue 3.5) et le style (Tailwind v4 Glassmorphism) de nos composants.
alwaysApply: true
---

# Directives de Conception UI Premium

## 1. Vue 3.5 & Réactivité Moderne
- **Script Setup strict :** Écris TOUS les composants avec `<script setup lang="ts">`.
- **Zéro export runtime dans `<script setup>` :** Seuls les types statiques (`export interface`, `export type`) sont autorisés dans `<script setup>`. Interdiction formelle d'y mettre des `export const` ou `export function` (ex: `cva(...)` doit rester local `const buttonVariants = cva(...)`, exporter uniquement son type `export type ButtonVariants = VariantProps<typeof buttonVariants>`).
- **Props destructurées réactives sans factory :** Exploite la déstructuration réactive native de Vue 3.5+ avec des valeurs par défaut littérales (`const { options = [], disabled = false } = defineProps<...>()`). Ne JAMAIS utiliser de fonction usine `() => []` dans la déstructuration (réservée à l'ancien macro `withDefaults`).
- **Liaison bidirectionnelle :** Utilise exclusivement `defineModel<T>()` pour les variables réactives partagées (`v-model`).
- **Accès DOM explicite :** Utilise `useTemplateRef()` pour typer et cibler un élément HTML, au lieu d'un `ref(null)` générique.
- **Gestion de la mémoire :** Applique systématiquement `onWatcherCleanup()` dans tes watchers asynchrones pour avorter les requêtes HTTP obsolètes ou nettoyer les écouteurs de défilement.

## 2. Design System & Styling (Tailwind v4 OKLCH + CVA)
- **Design Tokens :** Utilise exclusivement les classes utilitaires sémantiques basées sur nos tokens OKLCH (ex: `bg-background`, `text-primary`, `border-border`).
- **Verre Premium :** Pour tout effet de profondeur ou de carte, applique notre utilitaire de verre réactif `glass-interactive` ou les tokens d'élévation (`backdrop-blur-md`, `shadow-glass-sm`, `border-border-default`).
- **Zéro CSS brut arbitraire :** Interdiction d'écrire des valeurs arbitraires Tailwind (ex: `bg-[#12121a]` ou `w-[300px]`). Utilise les tokens ou l'évaluation de variables CSS de la v4 (ex: `w-(--sidebar-width)`).
- **Variantes déclaratives :** Utilise `class-variance-authority` (CVA) pour déclarer les variantes et fusionne-les avec notre helper `cn(...)` pour résoudre les conflits de spécificité.
- **Ergonomie tactile (Fitts's Law) :** Garantis une surface tactile minimale de 44x44px (`min-w-[44px] min-h-[44px] touch-manipulation`) sur tous les composants interactifs d'icônes ou boutons cibles.

## 3. Primitives Headless & Accessibilité (Reka UI)
- **Base accessible & Polymorphisme :** Bâtis les composants complexes sur les primitives de **Reka UI**. Exploite `Primitive` avec `as` et `asChild` pour déléguer proprement le rendu vers `<button>`, `<a>` ou `RouterLink`.
- **Contravariance et Typage des Événements :** Pour les événements comme `@update:model-value`, importe et utilise le type canonique de Reka UI (`type AcceptableValue` depuis `reka-ui`), et sécurise les gardes de type (`null`, `undefined`, tableaux) avant d'assigner au modèle.
- **Identifiants uniques :** Utilise la macro `useId()` native de Vue 3.5 pour lier les attributs sémantiques ARIA (`aria-describedby`, `aria-labelledby`).