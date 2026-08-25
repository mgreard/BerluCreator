# Spinner

Composant d'animation de chargement vectoriel circulaire optimisé avec `role="status"` et `aria-label` pour une accessibilité WAI-ARIA immédiate.

---

## Fonctionnalités

- **Rendu vectoriel pur :** SVG léger sans dépendances lourdes.
- **Taille & Couleur libres :** Supporte n'importe quelle unité CSS (`em`, `px`, `rem`) et hérite de `currentColor` par défaut.
- **Accessibilité :** Attribut `role="status"` et `aria-label` personnalisable.

---

## Props

| Prop        | Type     | Défaut                     | Description                               |
| :---------- | :------- | :------------------------- | :---------------------------------------- |
| `size`      | `string` | `'1em'`                    | Dimension du spinner (largeur et hauteur) |
| `color`     | `string` | `'currentColor'`           | Couleur du tracé                          |
| `ariaLabel` | `string` | `'Chargement en cours...'` | Libellé textuel pour lecteurs d'écran     |
| `class`     | `string` | `undefined`                | Classes CSS complémentaires               |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Spinner } from '@/components/ui/spinner'
</script>

<template>
  <!-- Spinner hérité dans un bouton -->
  <button class="inline-flex items-center gap-2">
    <Spinner size="1em" />
    <span>Envoi en cours...</span>
  </button>

  <!-- Spinner grand format accentué -->
  <Spinner size="48px" color="#6366f1" />
</template>
```
