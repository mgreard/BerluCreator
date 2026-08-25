# Skeleton

Composant d'anticipation de chargement de contenu (Placeholder Skeleton) avec effet de brillance dynamique (`shimmer-effect`) ou pulsation (`animate-pulse`), support multiligne intelligent et formes adaptatives.

---

## Fonctionnalités

- **Variantes de formes :** `text`, `circular`, `rounded`, `rectangular`, `card`, `avatar`.
- **Modes d'animation :** `shimmer` (balayage lumineux fluide), `pulse` (pulsation douce) ou `none`.
- **Rendu multiligne naturel :** Génération automatique de `lines: N` avec largeurs dégressives réalistes pour simuler un paragraphe.
- **Accessibilité :** Attributs `role="status"`, `aria-live="polite"` et texte masqué `.sr-only`.

---

## Props

| Prop        | Type                                                                       | Défaut      | Description                                        |
| :---------- | :------------------------------------------------------------------------- | :---------- | :------------------------------------------------- |
| `variant`   | `'text' \| 'circular' \| 'rounded' \| 'rectangular' \| 'card' \| 'avatar'` | `'text'`    | Type de forme                                      |
| `animation` | `'shimmer' \| 'pulse' \| 'none'`                                           | `'shimmer'` | Type d'animation                                   |
| `lines`     | `number`                                                                   | `1`         | Nombre de lignes à générer (pour `variant="text"`) |
| `width`     | `string \| number`                                                         | `undefined` | Largeur personnalisée                              |
| `height`    | `string \| number`                                                         | `undefined` | Hauteur personnalisée                              |
| `rounded`   | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full'`                | `undefined` | Surcharge du rayon d'arrondi                       |
| `class`     | `string`                                                                   | `undefined` | Classes CSS complémentaires                        |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <!-- Squelette d'avatar + texte -->
  <div class="flex items-center gap-3">
    <Skeleton variant="avatar" />
    <div class="flex-1">
      <Skeleton variant="text" :lines="2" />
    </div>
  </div>

  <!-- Squelette de carte personnalisée -->
  <Skeleton variant="card" height="180px" />
</template>
```
