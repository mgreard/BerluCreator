# Checkbox

Composant de case à cocher accessible basé sur **Reka UI** (`CheckboxRoot`, `CheckboxIndicator`), gérant les liaisons booléennes ou multiples (tableaux), l'état indéterminé, la liaison sémantique `aria-describedby` avec `useId()`, et conforme aux directives tactiles.

---

## Fonctionnalités

- **Liaison `v-model` Polymorphe :** Supporte aussi bien une valeur booléenne simple (`boolean`) qu'un tableau de valeurs (`unknown[]`).
- **Support de l'État Indéterminé :** Affichage d'un tiret pour les sélections partielles (`indeterminate = true`).
- **Accessibilité Sémantique ARIA :** Génération d'identifiant unique avec `useId()` et liaison automatique `aria-describedby` pour les descriptions.
- **Variantes de Tailles :** `sm`, `md` et `lg`.

---

## Props

| Prop            | Type                   | Défaut      | Description                             |
| :-------------- | :--------------------- | :---------- | :-------------------------------------- |
| `modelValue`    | `boolean \| unknown[]` | `false`     | Modèle de données lié (`v-model`)       |
| `value`         | `unknown`              | `true`      | Valeur dans le tableau en mode multiple |
| `label`         | `string`               | `undefined` | Libellé textuel                         |
| `description`   | `string`               | `undefined` | Texte descriptif secondaire             |
| `size`          | `'sm' \| 'md' \| 'lg'` | `'md'`      | Taille de la case                       |
| `disabled`      | `boolean`              | `false`     | Désactive la case                       |
| `error`         | `boolean \| string`    | `false`     | État ou message d'erreur                |
| `id`            | `string`               | `useId()`   | Identifiant HTML                        |
| `name`          | `string`               | `undefined` | Nom du champ                            |
| `indeterminate` | `boolean`              | `false`     | État indéterminé / partiel              |
| `class`         | `string`               | `undefined` | Classes CSS complémentaires             |

---

## Emits

| Événement           | Type de payload              | Description                         |
| :------------------ | :--------------------------- | :---------------------------------- |
| `change`            | `boolean \| 'indeterminate'` | Émis lors du changement d'état      |
| `update:modelValue` | `boolean \| unknown[]`       | Émis pour la mise à jour du v-model |

---

## Slots

| Slot           | Description                        |
| :------------- | :--------------------------------- |
| `#default`     | Personnalisation du label          |
| `#description` | Personnalisation de la description |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Checkbox } from '@/components/ui/checkbox'

const isSubscribed = ref(false)
</script>

<template>
  <Checkbox
    v-model="isSubscribed"
    label="S'abonner aux notifications"
    description="Recevez un récapitulatif chaque semaine."
  />
</template>
```
