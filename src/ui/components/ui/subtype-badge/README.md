# SubtypeBadge

Composant d'étiquette secondaire ou de sous-type (taxonomie hiérarchique, types d'objets, sous-classes), avec variantes discrètes et prise en charge de la troncature.

---

## Fonctionnalités

- **Variantes Discrètes :** `neutral` (avec bordure par défaut), `subtle` (sans bordure, fond adouci), `outline` (fond transparent).
- **Échelle de Tailles :** `mini` (arrondi léger `rounded`, taille texte `0.68rem`), `sm` (`rounded-full`, texte `xs`) et `md` (`rounded-full`, texte `sm`).
- **Troncature Adaptative (`ellipsis`) :** Évite les débordements de texte dans les conteneurs étroits.

---

## Props

| Prop       | Type                                 | Défaut      | Description                   |
| :--------- | :----------------------------------- | :---------- | :---------------------------- |
| `subType`  | `string`                             | `undefined` | Texte du sous-type            |
| `text`     | `string`                             | `undefined` | Alias pour le texte           |
| `size`     | `'mini' \| 'sm' \| 'md'`             | `'sm'`      | Taille du badge               |
| `ellipsis` | `boolean \| string \| number`        | `false`     | Activer la troncature         |
| `category` | `string`                             | `undefined` | Catégorie parente optionnelle |
| `variant`  | `'neutral' \| 'subtle' \| 'outline'` | `'neutral'` | Variante visuelle             |
| `class`    | `string`                             | `undefined` | Classes CSS complémentaires   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { SubtypeBadge } from '@/components/ui/subtype-badge'
</script>

<template>
  <SubtypeBadge subType="Elfe Sylvain" variant="neutral" />
  <SubtypeBadge subType="Vaisseau spatial" variant="subtle" size="mini" />
</template>
```
