# Combobox

Composant de boîte combinée avec champ de recherche intégré basé sur **Reka UI** (`ComboboxRoot`, `ComboboxAnchor`, `ComboboxContent`, `ComboboxViewport`, `ComboboxItem`), supportant le filtrage temps réel, la virtualisation pour grandes listes avec `useVirtualGrid`, et l'accessibilité clavier.

---

## Fonctionnalités

- **Recherche et Filtrage Intégrés :** Recherche en direct dans les libellés et descriptions des options.
- **Virtualisation Intelligente :** Active automatiquement le rendu virtuel au-delà d'un seuil configurable (`virtualThreshold = 15`).
- **Accessibilité Clavier Complète :** Navigation avec les flèches, sélection sur Entrée, fermeture sur Échap.
- **Effacement Rapide :** Bouton `×` contextuel pour réinitialiser la sélection sans ouvrir la liste.

---

## Props

| Prop                | Type                       | Défaut                         | Description                             |
| :------------------ | :------------------------- | :----------------------------- | :-------------------------------------- |
| `modelValue`        | `string \| number \| null` | `null`                         | Valeur sélectionnée (`v-model`)         |
| `options`           | `ComboboxOption[]`         | `[]`                           | Liste d'options                         |
| `placeholder`       | `string`                   | `'Sélectionner une option...'` | Texte d'indication                      |
| `searchPlaceholder` | `string`                   | `'Rechercher...'`              | Texte du champ de recherche             |
| `size`              | `'sm' \| 'md' \| 'lg'`     | `'md'`                         | Taille du composant                     |
| `disabled`          | `boolean`                  | `false`                        | Désactive le composant                  |
| `id`                | `string`                   | `undefined`                    | Identifiant HTML                        |
| `name`              | `string`                   | `undefined`                    | Nom du champ de formulaire              |
| `error`             | `boolean \| string`        | `false`                        | État ou message d'erreur                |
| `virtualThreshold`  | `number`                   | `15`                           | Seuil d'activation de la virtualisation |
| `class`             | `string`                   | `undefined`                    | Classes CSS complémentaires             |

---

## Emits

| Événement           | Type de payload            | Description                            |
| :------------------ | :------------------------- | :------------------------------------- |
| `change`            | `string \| number \| null` | Émis au changement de sélection        |
| `search`            | `string`                   | Émis à chaque frappe dans la recherche |
| `update:modelValue` | `string \| number \| null` | Émis pour la mise à jour du v-model    |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Combobox, type ComboboxOption } from '@/components/ui/combobox'

const selected = ref<string | null>('fr')

const countries: ComboboxOption[] = [
  { value: 'fr', label: 'France', description: 'Europe' },
  { value: 'de', label: 'Allemagne', description: 'Europe' },
  { value: 'jp', label: 'Japon', description: 'Asie' }
]
</script>

<template>
  <Combobox v-model="selected" :options="countries" placeholder="Sélectionner un pays..." />
</template>
```
