# DashboardLayout

Layout préconfiguré pour tableaux de bord et consoles d'administration complexes, combinant `Shell` (sidebar rétractable, tiroir mobile, header persistant) et `PageLayout` (défilement contrôlé, contrainte de largeur).

---

## Fonctionnalités

- **Composition Headless & Compound :** Réutilise directement `Shell` et `PageLayout` pour une cohérence absolue de l'interface.
- **Slots Délégués Intégralement :** `#sidebar`, `#sidebar-footer`, `#header`, `#header-actions`, `#footer` et `#default`.
- **Réactivité Mobile-First :** Bascule automatique en tiroir mobile sur écran tactile ou réduit.

---

## Props

| Prop          | Type                                        | Défaut               | Description                                                   |
| :------------ | :------------------------------------------ | :------------------- | :------------------------------------------------------------ |
| `sidebarOpen` | `boolean`                                   | `true`               | État d'ouverture de la barre latérale (`v-model:sidebarOpen`) |
| `brandTitle`  | `string`                                    | `'MyCompLib Studio'` | Nom de l'application                                          |
| `brandIcon`   | `string`                                    | `'bolt'`             | Nom de l'icône de marque                                      |
| `mode`        | `'scroll' \| 'fill'`                        | `'scroll'`           | Mode de défilement de la page                                 |
| `maxWidth`    | `'default' \| 'narrow' \| 'wide' \| 'full'` | `'default'`          | Contrainte de largeur maximale                                |
| `class`       | `string`                                    | `undefined`          | Classes CSS complémentaires                                   |

---

## Emits

| Événement            | Type de payload | Description                           |
| :------------------- | :-------------- | :------------------------------------ |
| `update:sidebarOpen` | `boolean`       | Synchronisation de l'état d'ouverture |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DashboardLayout } from '@/components/ui/dashboard-layout'

const sidebarOpen = ref(true)
</script>

<template>
  <DashboardLayout v-model:sidebarOpen="sidebarOpen" brand-title="Console Admin">
    <div class="space-y-4">
      <!-- Widgets du tableau de bord -->
    </div>
  </DashboardLayout>
</template>
```
