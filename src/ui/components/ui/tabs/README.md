# Tabs

Composant d'onglets accessible et interactif basé sur **Reka UI** (`TabsRoot`, `TabsList`, `TabsTrigger`, `TabsContent`), doté d'un indicateur glissant fluide animé par `ResizeObserver`, et de 3 variantes graphiques (`capsule`, `segmented`, `underline`).

---

## Fonctionnalités

- **Accessibilité WAI-ARIA Stricte :** Support des rôles `tablist`, `tab`, `tabpanel` et navigation clavier fléchée (modes `automatic` ou `manual`).
- **Micro-interactions Fluides :** Pilule glissante animée physiquement avec calcul précis du `getBoundingClientRect` et suivi par `ResizeObserver`.
- **Panneaux de Contenu Dynamiques :** Déclaration de contenu via la prop `content` ou via slots nommés `#tab-[key]`.
- **Badges et Icônes :** Affichage d'icônes préfixes et de pastilles de notification.

---

## Props

| Prop             | Type                                      | Défaut        | Description                       |
| :--------------- | :---------------------------------------- | :------------ | :-------------------------------- |
| `modelValue`     | `string \| number`                        | `undefined`   | Clé de l'onglet actif (`v-model`) |
| `tabs`           | `TabItem[]`                               | `[]`          | Définition des onglets            |
| `variant`        | `'capsule' \| 'segmented' \| 'underline'` | `'capsule'`   | Style graphique                   |
| `activationMode` | `'automatic' \| 'manual'`                 | `'automatic'` | Mode de bascule au clavier        |
| `size`           | `'sm' \| 'md'`                            | `'md'`        | Taille des onglets                |
| `class`          | `string`                                  | `undefined`   | Classes CSS complémentaires       |

---

## Emits

| Événement           | Type de payload    | Description                           |
| :------------------ | :----------------- | :------------------------------------ |
| `change`            | `string \| number` | Émis lors de la sélection d'un onglet |
| `update:modelValue` | `string \| number` | Émis pour la mise à jour du v-model   |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Tabs, type TabItem } from '@/components/ui/tabs'

const activeTab = ref('profile')

const tabs: TabItem[] = [
  { key: 'profile', label: 'Profil', icon: '👤', content: 'Édition du profil' },
  { key: 'settings', label: 'Paramètres', icon: '⚙️', content: 'Paramètres de l’application' }
]
</script>

<template>
  <Tabs v-model="activeTab" :tabs="tabs" variant="capsule" />
</template>
```
