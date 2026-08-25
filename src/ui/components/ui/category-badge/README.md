# CategoryBadge

Composant d'étiquette de catégorie thématique avec support des icônes Material Symbols, emojis, personnalisation dynamique des couleurs (`subtle`, `solid`, `outline`) et gestion fine de la troncature (`ellipsis`).

---

## Fonctionnalités

- **Sources d'Icônes Polyvalentes :** Support des Material Symbols (`iconType="symbol"`) et des emojis (`iconType="emoji"`).
- **Thématisation Dynamique :** Configuration par objet `themeConfig` ou props individuelles (`color`, `bgColor`).
- **Troncature Adaptative (`ellipsis`) :** Booléen ou largeur explicite en pixels/CSS pour éviter les débordements de texte.
- **Échelle de Tailles :** `mini` (très compact pour tableaux), `sm` (standard) et `md` (grand format).

---

## Props

| Prop          | Type                               | Défaut      | Description                         |
| :------------ | :--------------------------------- | :---------- | :---------------------------------- |
| `category`    | `string`                           | `''`        | Identifiant de catégorie de secours |
| `label`       | `string`                           | `undefined` | Label affiché                       |
| `themeConfig` | `CategoryThemeConfig`              | `undefined` | Objet de configuration complet      |
| `color`       | `string`                           | `undefined` | Couleur d'accentuation              |
| `bgColor`     | `string`                           | `undefined` | Couleur d'arrière-plan              |
| `iconName`    | `string`                           | `undefined` | Nom du Material Symbol              |
| `icon`        | `string`                           | `undefined` | Emoji                               |
| `size`        | `'mini' \| 'sm' \| 'md'`           | `'sm'`      | Taille du badge                     |
| `iconType`    | `'symbol' \| 'emoji' \| 'none'`    | `'symbol'`  | Type d'icône                        |
| `ellipsis`    | `boolean \| string \| number`      | `false`     | Activer la troncature               |
| `variant`     | `'subtle' \| 'solid' \| 'outline'` | `'subtle'`  | Variante visuelle                   |
| `interactive` | `boolean`                          | `false`     | Micro-interaction au survol         |
| `class`       | `string`                           | `undefined` | Classes CSS complémentaires         |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { CategoryBadge } from '@/components/ui/category-badge'
</script>

<template>
  <CategoryBadge label="Design System" iconName="palette" variant="subtle" />

  <CategoryBadge label="Productivité" icon="⚡" iconType="emoji" size="mini" />
</template>
```
