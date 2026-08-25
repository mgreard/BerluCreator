# Icon

Composant d'affichage d'icônes optimisé pour **Material Symbols Outlined** avec support des variations typographiques (remplissage plein, échelle de tailles, et normalisation automatique des noms).

---

## Fonctionnalités

- **Échelle de tailles prédéfinies :** `xs` (14px), `sm` (18px), `md` (22px), `lg` (28px), `xl` (36px), ou valeur CSS arbitraire.
- **Surcharge contextuelle :** La variable CSS `--mcl-icon-size` peut remplacer la prop `size` dans un conteneur, dont la valeur reste utilisée comme fallback.
- **Remplissage plein (`filled`) :** Modifie la variable typographique `'FILL' 1` via `fontVariationSettings`.
- **Accessibilité native :** Marqué par défaut avec `aria-hidden="true"`.
- **Normalisation des noms :** Convertit automatiquement les tirets en underscores (ex: `view-column` -> `view_column`).

---

## Props

| Prop     | Type                                             | Défaut      | Description                                   |
| :------- | :----------------------------------------------- | :---------- | :-------------------------------------------- |
| `name`   | `string`                                         | **requis**  | Nom de l'icône Material Symbol                |
| `size`   | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| string` | `'md'`      | Taille de l'icône                             |
| `filled` | `boolean`                                        | `false`     | Remplissage plein (Filled style)              |
| `color`  | `string`                                         | `undefined` | Couleur personnalisée (défaut `currentColor`) |
| `class`  | `string`                                         | `undefined` | Classes CSS supplémentaires                   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Icon } from '@/components/ui/icon'
</script>

<template>
  <!-- Icône standard -->
  <Icon name="search" size="md" />

  <!-- Icône pleine en taille large -->
  <Icon name="favorite" :filled="true" size="lg" class="text-danger" />

  <!-- Icône avec taille CSS libre -->
  <Icon name="settings" size="32px" />
</template>
```
