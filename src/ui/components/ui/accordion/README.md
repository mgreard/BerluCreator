# Accordion

Composant d'accordéon rétractable et volets déroulants basé sur **Reka UI** (`AccordionRoot`, `AccordionItem`, `AccordionHeader`, `AccordionTrigger`, `AccordionContent`), supportant les modes exclusif (`single`) ou multiple (`multiple`), l'animation fluide de hauteur et la personnalisation modulaire.

---

## Fonctionnalités

- **Modes d'Ouverture :** `single` (un volet actif à la fois, refermable avec `collapsible`) et `multiple` (plusieurs volets ouverts simultanément).
- **Variantes Visuelles :** `card` (blocs séparés avec effet verre `glass`), `default` (lignes avec séparateurs simples) et `bordered` (cadre global arrondi).
- **En-têtes Enrichis :** Icône, titre principal, sous-titre optionnel, badge contextuel et chevron animé rotatif.
- **Liaison `v-model` Réactive :** Modèle bidirectionnel typé (`string` ou `string[]`).

---

## Props

| Prop          | Type                                | Défaut      | Description                              |
| :------------ | :---------------------------------- | :---------- | :--------------------------------------- |
| `modelValue`  | `string \| string[] \| undefined`   | `undefined` | Valeur(s) des volets ouverts (`v-model`) |
| `items`       | `AccordionItemData[]`               | `[]`        | Données déclaratives des volets          |
| `type`        | `'single' \| 'multiple'`            | `'single'`  | Mode d'ouverture                         |
| `collapsible` | `boolean`                           | `true`      | Autorise la fermeture en mode 'single'   |
| `disabled`    | `boolean`                           | `false`     | Désactivation globale                    |
| `variant`     | `'default' \| 'card' \| 'bordered'` | `'card'`    | Variante visuelle                        |
| `class`       | `string`                            | `undefined` | Classes CSS complémentaires              |

---

## Emits

| Événement           | Type de payload                   | Description                         |
| :------------------ | :-------------------------------- | :---------------------------------- |
| `change`            | `string \| string[] \| undefined` | Émis au changement de sélection     |
| `update:modelValue` | `string \| string[] \| undefined` | Émis pour la mise à jour du v-model |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Accordion, type AccordionItemData } from '@/components/ui/accordion'

const activeItem = ref<string>('faq-1')

const items: AccordionItemData[] = [
  {
    value: 'faq-1',
    title: 'Quels navigateurs sont supportés ?',
    content:
      'Tous les navigateurs modernes prenant en charge les CSS Container Queries et l’espace OKLCH.'
  },
  {
    value: 'faq-2',
    title: 'Est-ce compatible avec Tailwind v4 ?',
    content: 'Oui, entièrement optimisé pour Tailwind CSS v4 et Reka UI.'
  }
]
</script>

<template>
  <Accordion v-model="activeItem" :items="items" variant="card" />
</template>
```
