# IconButton

Composant de bouton circulaire optimisé pour les icônes, respectant strictement la loi de Fitts (zone tactile minimale de 44x44px y compris pour les petites tailles `xs` et `sm` via pseudo-éléments invisibles), avec accessibilité WAI-ARIA native.

---

## Fonctionnalités

- **Ergonomie & Loi de Fitts :** Garantit une surface tactile minimale de 44x44px (`touch-manipulation`) quel que soit le format d'affichage.
- **Variantes :** `ghost`, `secondary` (verre dépoli), `accent`, `primary`, `destructive`, `fav` (favori dynamique).
- **Contenu :** Accepte un nom Material Symbols via `icon` lorsque le slot par défaut est vide ; un slot fourni reste prioritaire.
- **Accessibilité :** Gestion obligatoire du libellé accessible (`ariaLabel` ou fallback `title`).
- **Polymorphisme :** Prise en charge de `as` et `asChild` pour déléguer le rendu vers un lien ou composant tiers.

---

## Props

| Prop        | Type                                                                        | Défaut      | Description                               |
| :---------- | :-------------------------------------------------------------------------- | :---------- | :---------------------------------------- |
| `icon`      | `string`                                                                    | `undefined` | Icône Material Symbols sans slot          |
| `variant`   | `'ghost' \| 'secondary' \| 'accent' \| 'primary' \| 'destructive' \| 'fav'` | `'ghost'`   | Variante visuelle du bouton               |
| `size`      | `'xs' \| 'sm' \| 'md' \| 'lg'`                     | `'md'`      | Taille visible du bouton                  |
| `active`    | `boolean`                                          | `false`     | État actif (ex: favori coché)             |
| `disabled`  | `boolean`                                          | `false`     | Désactive les interactions                |
| `ariaLabel` | `string`                                           | `undefined` | Libellé accessible ARIA                   |
| `title`     | `string`                                           | `undefined` | Titre au survol / fallback ARIA           |
| `type`      | `'button' \| 'submit' \| 'reset'`                  | `'button'`  | Type de bouton HTML natif                 |
| `as`        | `string \| Component`                              | `'button'`  | Surcharge de la balise HTML               |
| `asChild`   | `boolean`                                          | `false`     | Rendu headless délégué à l'élément enfant |
| `class`     | `string`                                           | `undefined` | Classes CSS complémentaires               |

---

## Emits

| Événement | Type de payload | Description                                        |
| :-------- | :-------------- | :------------------------------------------------- |
| `click`   | `MouseEvent`    | Émis lors du clic si le bouton n'est pas désactivé |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
</script>

<template>
  <!-- Raccourci pour une icône Material Symbols -->
  <IconButton icon="download" ariaLabel="Télécharger" />

  <!-- Bouton d'icône standard -->
  <IconButton ariaLabel="Paramètres" @click="openSettings">
    <Icon name="settings" size="sm" />
  </IconButton>

  <!-- Bouton Favori basculant -->
  <IconButton
    variant="fav"
    :active="isFavorite"
    :ariaLabel="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
    @click="toggleFavorite"
  >
    <Icon name="favorite" :filled="isFavorite" size="sm" />
  </IconButton>
</template>
```
