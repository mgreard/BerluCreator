# Shell

Composant d'architecture globale d'application (App Layout Shell) responsive, intégrant une barre latérale rétractable sur grand écran (`collapsible`), un tiroir mobile accessible avec focus trap et verrouillage de défilement (Reka UI `DialogRoot`), un en-tête persistant et un pied de page optionnel.

---

## Fonctionnalités

- **Sidebar Desktop Rétractable :** Transition fluide entre mode complet (largeur `w-64`) et mode compact (`w-20`).
- **Tiroir Mobile Accessible :** Basé sur Reka UI avec focus trap, fermeture par touche `Échap` et clic à l'extérieur.
- **Glassmorphism & Structure Modulaire :** Header dépoli persistant (`sticky top-0`) et slots `#sidebar`, `#sidebar-header`, `#sidebar-footer`, `#header`, `#header-actions`, `#footer`.

---

## Props

| Prop          | Type      | Défaut        | Description                                                   |
| :------------ | :-------- | :------------ | :------------------------------------------------------------ |
| `sidebarOpen` | `boolean` | `true`        | État d'ouverture de la barre latérale (`v-model:sidebarOpen`) |
| `collapsible` | `boolean` | `true`        | Autorise le repliage de la barre latérale                     |
| `brandTitle`  | `string`  | `'MyCompLib'` | Titre de la marque dans l'en-tête                             |
| `brandIcon`   | `string`  | `'diamond'`   | Nom de l'icône de la marque                                   |
| `class`       | `string`  | `undefined`   | Classes CSS complémentaires                                   |

---

## Emits

| Événement            | Type de payload | Description                                     |
| :------------------- | :-------------- | :---------------------------------------------- |
| `toggle-sidebar`     | `boolean`       | Émis lors du clic sur le bouton de repliage     |
| `update:sidebarOpen` | `boolean`       | Émis pour synchroniser le `v-model:sidebarOpen` |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Shell } from '@/components/ui/shell'

const isSidebarOpen = ref(true)
</script>

<template>
  <Shell v-model:sidebarOpen="isSidebarOpen" brand-title="Mon Application">
    <template #sidebar="{ isCollapsed }">
      <nav>...</nav>
    </template>
    <div class="p-6">Page de contenu...</div>
  </Shell>
</template>
```
