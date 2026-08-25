# MentionInput

Composant d'éditeur de texte avancé avec autocomplétion intelligente de mentions (`@`, `#`, `:`, etc.), positionnement précis par Mirror DOM, composable headless `useMentionInput`, boutons raccourcis, et barre de badges réactive.

---

## Fonctionnalités

- **Déclencheurs Multiples & Extensibles :** Définition libre de déclencheurs (`@utilisateur`, `#tag`, `:emoji`, `/commande`) avec recherche synchrone ou asynchrone (Promesses).
- **Positionnement Physique (Mirror DOM) :** Calcule la position exacte du curseur dans le texte pour ancrer le popover de suggestions sans saut visuel.
- **Raccourcis Clavier :** Navigation intuitive (`Flèche Haut`, `Flèche Bas`, `Entrée`, `Tab`, `Échap`).
- **Prévisualisation en Badges :** Extraction automatique et affichage des jetons sous forme de badges supprimables au clic.

---

## Props

| Prop                 | Type                        | Défaut                         | Description                          |
| :------------------- | :-------------------------- | :----------------------------- | :----------------------------------- |
| `modelValue`         | `string`                    | `''`                           | Texte de l'éditeur (`v-model`)       |
| `triggers`           | `MentionTrigger<any>[]`     | `[]`                           | Déclencheurs de mention              |
| `multiline`          | `boolean`                   | `true`                         | Mode textarea ou input simple        |
| `rows`               | `number`                    | `3`                            | Nombre de lignes en mode multiline   |
| `placeholder`        | `string`                    | `'Tapez @ pour mentionner...'` | Texte indicatif                      |
| `previewBadges`      | `boolean`                   | `false`                        | Affiche la barre de badges de résumé |
| `showTriggerButtons` | `boolean`                   | `true`                         | Affiche la barre de raccourcis       |
| `badgeParser`        | `(text: string) => Token[]` | `undefined`                    | Parseur personnalisé pour les badges |
| `disabled`           | `boolean`                   | `false`                        | Désactive le champ                   |
| `readonly`           | `boolean`                   | `false`                        | Reste en lecture seule               |
| `error`              | `boolean \| string`         | `false`                        | État ou message d'erreur             |
| `id`                 | `string`                    | `useId()`                      | Identifiant HTML                     |
| `name`               | `string`                    | `undefined`                    | Nom du champ de formulaire           |
| `class`              | `string`                    | `undefined`                    | Classes CSS complémentaires          |

Chaque `MentionTrigger` peut activer `allowSpaces` pour conserver une requête ouverte sur les noms composés. Par défaut, un espace termine la recherche afin de préserver le comportement attendu des mentions courtes.

---

## Emits

| Événement           | Type de payload                         | Description                          |
| :------------------ | :-------------------------------------- | :----------------------------------- |
| `select`            | `(item: T, trigger: MentionTrigger<T>)` | Émis à la sélection d'une suggestion |
| `focus`             | `FocusEvent`                            | Émis lors du focus                   |
| `blur`              | `FocusEvent`                            | Émis lors de la perte de focus       |
| `update:modelValue` | `string`                                | Émis à chaque saisie                 |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { MentionInput, type MentionTrigger } from '@/components/ui/mention-input'

const text = ref('')

const userTrigger: MentionTrigger = {
  char: '@',
  search: (q) =>
    ['Alice', 'Bob', 'Charlie'].filter((u) => u.toLowerCase().includes(q.toLowerCase())),
  format: (u) => `@${u} `
}
</script>

<template>
  <MentionInput v-model="text" :triggers="[userTrigger]" placeholder="Écrire un commentaire..." />
</template>
```
