# LayoutProvider

Composant d'injection dynamique de layout avec découpage de code optimisé (`defineAsyncComponent`), permettant de basculer instantanément entre différents gabarits de page (`dashboard`, `auth`, `default`, ou composant personnalisé).

---

## Fonctionnalités

- **Code Splitting Automatique :** Charge les gabarits lourds à la demande sans alourdir le bundle initial (optimisation Core Web Vitals LCP).
- **Résolution Polymorphe :** Accepte une chaîne identifiante (`'dashboard'`, `'auth'`, `'default'`) ou directement un objet composant Vue.

---

## Props

| Prop     | Type                   | Défaut      | Description                |
| :------- | :--------------------- | :---------- | :------------------------- |
| `layout` | `LayoutType \| object` | `'default'` | Nom du layout ou composant |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { LayoutProvider } from '@/components/ui/layout-provider'
</script>

<template>
  <LayoutProvider layout="dashboard">
    <router-view />
  </LayoutProvider>
</template>
```
