# LoadingState

Composant d'affichage d'état d'attente / chargement asynchrone combinant un conteneur en verre dépoli et le composant atomique `Spinner`.

---

## Fonctionnalités

- **Conteneur Glassmorphic :** Surface translucide élégante (`backdrop-blur-md`, `rounded-3xl`, `shadow-glass-sm`).
- **Spinner intégré :** Intègre le composant `Spinner` avec gestion libre de la taille (`spinnerSize`).
- **Personnalisation du message :** Via la prop `message` ou le slot `<slot />`.

---

## Props

| Prop          | Type     | Défaut                     | Description                    |
| :------------ | :------- | :------------------------- | :----------------------------- |
| `message`     | `string` | `'Chargement en cours...'` | Texte descriptif du chargement |
| `spinnerSize` | `string` | `'28px'`                   | Dimension du spinner           |
| `class`       | `string` | `undefined`                | Classes CSS complémentaires    |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { LoadingState } from '@/components/ui/loading-state'
</script>

<template>
  <LoadingState message="Récupération des données utilisateur..." />
</template>
```
