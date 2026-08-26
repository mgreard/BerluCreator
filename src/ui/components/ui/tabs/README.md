# Tabs

Composant d’onglets accessible basé sur Reka UI. Il prend en charge les navigations horizontales classiques et un rail vertical coloré destiné aux barres d’outils compactes.

## Fonctionnalités

- Sémantique WAI-ARIA et navigation clavier selon l’orientation.
- Variantes `capsule`, `segmented`, `underline` et `rail`.
- Contenu via la prop `content` ou les slots `#tab-[key]`.
- Icônes, badges et tons colorés optionnels par onglet.
- Indicateur animé sur la variante `capsule`.

## Props

| Prop | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `modelValue` | `string \| number` | `undefined` | Clé de l’onglet actif (`v-model`). |
| `tabs` | `TabItem[]` | `[]` | Définition des onglets. |
| `variant` | `'capsule' \| 'segmented' \| 'underline' \| 'rail'` | `'capsule'` | Style graphique. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Axe visuel et navigation aux flèches. |
| `ariaLabel` | `string` | `'Onglets'` | Libellé accessible de la liste. |
| `activationMode` | `'automatic' \| 'manual'` | `'automatic'` | Mode de bascule au clavier. |
| `size` | `'sm' \| 'md'` | `'md'` | Taille des onglets classiques. |
| `class` | `string` | `undefined` | Classes appliquées à la liste. |

Un `TabItem` accepte `key`, `label`, `icon`, `badge`, `disabled`, `content` et un `tone` optionnel. Les tons disponibles sont `neutral`, `indigo`, `sky`, `amber`, `rose`, `red`, `cyan`, `emerald`, `lime`, `purple` et `yellow`.

## Exemple de rail vertical

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Tabs, type TabItem } from '@/components/ui/tabs'

const activeTab = ref('all')
const tabs: TabItem[] = [
  { key: 'all', label: 'Tous les sprites', icon: 'apps', badge: 68, tone: 'indigo' },
  { key: 'eyes', label: 'Yeux', icon: 'visibility', badge: 6, tone: 'cyan' }
]
</script>

<template>
  <Tabs
    v-model="activeTab"
    :tabs="tabs"
    variant="rail"
    orientation="vertical"
    aria-label="Catégories de sprites"
  />
</template>
```

## Événements

- `update:modelValue`: met à jour le `v-model`.
- `change`: émis après la sélection d’un onglet.
