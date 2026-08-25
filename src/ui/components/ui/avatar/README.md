# Avatar

Composant d'affichage d'avatar utilisateur ou profil basé sur **Reka UI** (`AvatarRoot`, `AvatarImage`, `AvatarFallback`), supportant la dérivation automatique d'initiales, les pastilles de présence et les micro-interactions tactiles (Fitts 44px).

---

## Fonctionnalités

- **Génération Intelligente du Fallback :** Dérive automatiquement les initiales (ex: `Marie Curie` -> `MC`) avec fallback sur emoji générique `👤` ou slot `#fallback`.
- **Statut de Présence (`status`) :** Pastilles de connexion (`online`, `busy`, `away`, `offline`) avec `role="status"` et positionnement adapté à la forme de l'avatar.
- **Formes & Échelle :** Formes (`circle`, `rounded`, `square`) et tailles (`xs`, `sm`, `md`, `lg`, `xl`, `2xl`).
- **Accessibilité & Ergonomie Tactile :** Support de `clickable` avec navigation clavier (`Entrée` / `Espace`) et zone d'impact tactile Fitts 44x44px.

---

## Props

| Prop             | Type                                            | Défaut           | Description                       |
| :--------------- | :---------------------------------------------- | :--------------- | :-------------------------------- |
| `src`            | `string`                                        | `undefined`      | URL de l'image                    |
| `alt`            | `string`                                        | `undefined`      | Texte alternatif                  |
| `fallback`       | `string`                                        | `undefined`      | Initiales explicites              |
| `name`           | `string`                                        | `undefined`      | Nom complet de l'utilisateur      |
| `size`           | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'`           | Taille de l'avatar                |
| `shape`          | `'circle' \| 'rounded' \| 'square'`             | `'circle'`       | Forme de l'arrondi                |
| `variant`        | `'default' \| 'bordered' \| 'glass'`            | `'default'`      | Variante visuelle                 |
| `status`         | `'online' \| 'busy' \| 'away' \| 'offline'`     | `undefined`      | Indicateur de présence            |
| `statusPosition` | `'bottom-right' \| 'top-right'`                 | `'bottom-right'` | Position de la pastille           |
| `clickable`      | `boolean`                                       | `false`          | Active le mode interactif         |
| `delayMs`        | `number`                                        | `0`              | Délai avant affichage du fallback |
| `class`          | `string`                                        | `undefined`      | Classes CSS complémentaires       |

---

## Emits

| Événement               | Type de payload                              | Description                                |
| :---------------------- | :------------------------------------------- | :----------------------------------------- |
| `click`                 | `MouseEvent \| KeyboardEvent`                | Émis au clic                               |
| `loading-status-change` | `'idle' \| 'loading' \| 'loaded' \| 'error'` | Changement d'état de chargement de l'image |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Avatar } from '@/components/ui/avatar'
</script>

<template>
  <!-- Avatar avec image et statut en ligne -->
  <Avatar
    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80"
    name="Marie Curie"
    status="online"
    size="lg"
  />

  <!-- Avatar avec dérivation automatique d'initiales -->
  <Avatar name="Albert Einstein" size="md" variant="glass" />
</template>
```
