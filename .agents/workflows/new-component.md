---
name: new-component
description: Pipeline standardisé 2026 pour concevoir, prototyper, typer, styliser, documenter avec Histoire et tester un composant colocalisé (Vue 3.5 + Tailwind v4 + Reka UI).
---

# Workflow de Création d'un Nouveau Composant UI (Colocalisé)

## Objectif
Concevoir un composant atomique découplé, hautement accessible (WAI-ARIA), conforme au design system Tailwind v4 Glassmorphic et colocalisé dans son propre répertoire dédié.

---

## Structure Cible (1 Dossier par Composant)

Tout nouveau composant doit être créé dans `src/components/ui/<component-name>/` selon la nomenclature kebab-case pour le dossier et PascalCase pour le SFC :

```text
src/components/ui/<component-name>/
├── <ComponentName>.vue         # Implémentation SFC (Vue 3.5+, script setup, CVA local)
├── <ComponentName>.story.vue   # Story Histoire (Variantes + Playground interactif)
├── <ComponentName>.spec.ts     # Tests unitaires Vitest / Testing Library
├── types.ts                    # Interfaces TypeScript (Props, Emits, Slots, Variants)
├── README.md                   # Documentation technique, API et directives d'accessibilité
└── index.ts                    # Barrel export local du composant et de ses types
```

---

## Étapes du Workflow

### 1. Phase de Spécification des Types (`types.ts`)
* Rédige d'abord le contrat d'interface complet dans `types.ts` :
  ```typescript
  import type { VariantProps } from 'class-variance-authority'
  import type { Component } from 'vue'

  export interface <ComponentName>Props {
    variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    as?: string | Component
    asChild?: boolean
    class?: string
  }

  export interface <ComponentName>Emits {
    (e: 'click', event: MouseEvent): void
  }
  ```
* Respecte la stricte isolation des types : aucun objet runtime n'est exporté depuis ce fichier.

---

### 2. Implémentation SFC (`<ComponentName>.vue`)
* Utilise `<script setup lang="ts">` exclusivement.
* Applique la **destructuration réactive native de Vue 3.5+** avec valeurs par défaut littérales (sans factory `() => []`) :
  ```typescript
  import { computed } from 'vue'
  import { Primitive } from 'reka-ui'
  import { cva, type VariantProps } from 'class-variance-authority'
  import { cn } from '@/shared/utils/cn'
  import type { <ComponentName>Props, <ComponentName>Emits } from './types'

  const buttonVariants = cva('...', { ... })
  export type <ComponentName>Variants = VariantProps<typeof buttonVariants>

  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    as = 'button',
    asChild = false,
    class: className = undefined
  } = defineProps<<ComponentName>Props>()

  const emit = defineEmits<<ComponentName>Emits>()
  ```
* **Liaison bidirectionnelle :** Utilise `defineModel<T>()` pour toute valeur `v-model`.
* **Primitives Reka UI :** Intègre les primitives Reka UI (`Primitive`, `as`, `asChild`) et types canoniques (`AcceptableValue`).
* **Tokens Tailwind v4 :** Utilise les classes `@theme` (`bg-background`, `text-primary`, `border-border`, etc.) et `@utility glass-interactive`.
* **Ergonomie tactile :** Minimum 44x44px (`min-w-[44px] min-h-[44px] touch-manipulation`) sur les éléments interactifs.

---

### 3. Story Interactive Histoire (`<ComponentName>.story.vue`)
* Documente toutes les variantes et états du composant avec un playground interactif :
  ```vue
  <script setup lang="ts">
  import { ref } from 'vue'
  import <ComponentName> from './<ComponentName>.vue'
  import type { <ComponentName>Props } from './types'

  const variants = ['primary', 'secondary', 'ghost', 'destructive'] as const
  const sizes = ['sm', 'md', 'lg'] as const

  const state = ref<<ComponentName>Props>({
    variant: 'primary',
    size: 'md',
    disabled: false
  })
  </script>

  <template>
    <Story title="UI/<ComponentName>" :layout="{ type: 'grid', width: '250px' }">
      <Variant v-for="v in variants" :key="v" :title="v">
        <<ComponentName> :variant="v">{{ v }}</<ComponentName>>
      </Variant>

      <Variant title="Interactive Playground">
        <template #default>
          <<ComponentName> v-bind="state">Interactive Button</<ComponentName>>
        </template>
        <template #controls>
          <HstSelect v-model="state.variant" title="Variant" :options="variants" />
          <HstSelect v-model="state.size" title="Size" :options="sizes" />
          <HstCheckbox v-model="state.disabled" title="Disabled" />
        </template>
      </Variant>
    </Story>
  </template>
  ```

---

### 4. Tests Unitaires & d'Accessibilité (`<ComponentName>.spec.ts`)
* Rédige les tests unitaires avec Vitest et `@vue/test-utils` :
  - Rendu par défaut et application des variantes CVA.
  - Comportement des états interactifs (`disabled`, `loading`, `v-model`).
  - Accessibilité sémantique ARIA (`role`, `aria-disabled`, etc.).

---

### 5. Documentation Locale (`README.md`)
* Décris le rôle du composant, ses props, ses emits, ses slots, un exemple minimal et les considérations WAI-ARIA.

---

### 6. Barrel Export Local (`index.ts`) & Global (`src/index.ts`)
* **Local `index.ts` :**
  ```typescript
  export { default as <ComponentName> } from './<ComponentName>.vue'
  export * from './types'
  ```
* **Global `src/components/ui/index.ts` & `src/index.ts` :**
  - Réexporte le composant et ses types.
  - Ajoute le composant au dictionnaire du plugin `install(app)`.

---

## Critères de Validation
- Le typage est strict et valide (`pnpm typecheck` sans erreur).
- Le composant est visible et manipulable dans Histoire (`pnpm story`).
- Les tests unitaires passent à 100% (`pnpm test:unit`).