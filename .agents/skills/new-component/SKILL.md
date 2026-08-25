---
name: new-component
description: Guide de scaffolding et de création d'un composant UI modulaire et colocalisé (types.ts, SFC Vue 3.5, story Histoire, spec Vitest, README.md, index.ts).
alwaysApply: false
---

# Skill : Création d'un Nouveau Composant Colocalisé

Cette skill guide l'agent dans la création standardisée et automatisée d'un composant d'interface colocalisé dans `src/components/ui/<component-name>/`.

---

## 1. Structure Obligatoire

Pour tout composant `<ComponentName>` (ex: `Button`, `Modal`, `DataTable`), crée le dossier `src/components/ui/<component-name>/` contenant exactement :

1. **`types.ts`** : Interfaces des Props, Emits, Slots et types CVA.
2. **`<ComponentName>.vue`** : SFC avec `<script setup lang="ts">`, destructuration native des props, Reka UI, `defineModel<T>()`, `useTemplateRef()` et CVA local.
3. **`<ComponentName>.story.vue`** : Story Histoire avec grille de variantes et playground de contrôles interactifs.
4. **`<ComponentName>.spec.ts`** : Tests unitaires Vitest.
5. **`README.md`** : Spécifications et documentation d'usage.
6. **`index.ts`** : Barrel export local.

---

## 2. Règles d'Or du Code

* **Zéro export runtime dans `<script setup>` :** Ne jamais exporter de `const` ou `function` depuis le bloc `<script setup>`.
* **Destructuration réactive native :** `const { variant = 'primary', disabled = false } = defineProps<ButtonProps>()`.
* **Style & Tokens :** Classes `@theme` Tailwind CSS v4, aucun CSS arbitraire hardcodé.
* **Accessibilité :** Zone tactile 44x44px minimum (`min-h-[44px] min-w-[44px] touch-manipulation`) et attributs ARIA natifs Reka UI.

---

## 3. Enregistrement

Après la création des fichiers locaux :
1. Exporter dans le barrel parent `src/components/ui/index.ts`.
2. Enregistrer dans `src/index.ts` (export nommé + dictionnaire du plugin).
