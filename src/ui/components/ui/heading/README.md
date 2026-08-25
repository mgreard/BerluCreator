# Heading

Composant typographique accessible et polymorphe basé sur Reka UI `Primitive` et Tailwind CSS v4.

---

## Fonctionnalités

- **Résolution automatique du tag HTML :** Associe automatiquement `h1`, `h2`, `h3` ou `h4` selon la variante choisie (`hero`, `page`, `section`, `card`, `sm`).
- **Polymorphisme total :** Surcharge du tag HTML ou rendu headless via `as` / `asChild`.
- **Couleurs sémantiques :** Support des tokens OKLCH et du dégradé textuel (`gradient`).
- **Troncature réactive :** Support du single-line `truncate` et du multi-line clamp (`truncate: 2`).

---

## Props

| Prop       | Type                                                                          | Défaut      | Description                                           |
| :--------- | :---------------------------------------------------------------------------- | :---------- | :---------------------------------------------------- |
| `as`       | `string \| Component`                                                         | `auto`      | Balise HTML ou composant cible (ex: `'h1'`, `'span'`) |
| `variant`  | `'hero' \| 'page' \| 'section' \| 'card' \| 'sm'`                             | `'section'` | Variante typographique                                |
| `color`    | `'primary' \| 'secondary' \| 'muted' \| 'inverse' \| 'gradient' \| 'inherit'` | `'primary'` | Couleur sémantique                                    |
| `truncate` | `boolean \| number`                                                           | `false`     | Troncature sur 1 ou N lignes                          |
| `asChild`  | `boolean`                                                                     | `false`     | Rendu délégué au premier enfant                       |
| `class`    | `string`                                                                      | `undefined` | Classes CSS utilitaires complémentaires               |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Heading } from '@/components/ui/heading'
</script>

<template>
  <Heading variant="hero" color="gradient"> Titre Principal </Heading>

  <Heading variant="section" :truncate="2">
    Sous-titre descriptif avec limitation à deux lignes
  </Heading>
</template>
```
