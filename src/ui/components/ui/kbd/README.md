# Kbd

Composant d'affichage de touches de clavier et raccourcis clavier (`font-mono font-bold`), supportant les séquences de touches uniques ou multiples et plusieurs styles visuels.

---

## Fonctionnalités

- **Support Multi-touches :** Chaîne unique (`keys="⌘K"`) ou tableau de touches (`keys="['⌘', 'Shift', 'P']"`).
- **Variantes de Style :** `default` (aspect touche physique), `outline` (contour transparent), `subtle` (fond discret), `glass` (effet verre dépoli `glass-interactive`).
- **Échelle de Tailles :** `xs` (h-5), `sm` (h-6), `md` (h-7), `lg` (h-8).

---

## Props

| Prop      | Type                                            | Défaut      | Description                 |
| :-------- | :---------------------------------------------- | :---------- | :-------------------------- |
| `keys`    | `string \| string[]`                            | `undefined` | Touche(s) à afficher        |
| `size`    | `'xs' \| 'sm' \| 'md' \| 'lg'`                  | `'sm'`      | Taille de la touche         |
| `variant` | `'default' \| 'outline' \| 'subtle' \| 'glass'` | `'default'` | Variante visuelle           |
| `class`   | `string`                                        | `undefined` | Classes CSS complémentaires |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Kbd } from '@/components/ui/kbd'
</script>

<template>
  <!-- Touche simple -->
  <Kbd keys="⌘K" />

  <!-- Combinaison de touches -->
  <Kbd :keys="['Ctrl', 'Shift', 'P']" size="md" variant="glass" />
</template>
```
