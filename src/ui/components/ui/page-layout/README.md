# PageLayout

Composant d'agencement structurel de page responsive avec gestion du défilement (`mode="scroll"` ou `mode="fill"`), limitation de largeur (`maxWidth`), support d'un volet latéral asynchrone (`#sidebar`) et découpage en zones sémantiques (`#header`, `#toolbar`, `#filters`, `#footer`).

---

## Fonctionnalités

- **Modes de Défilement :**
  - `scroll` : Défilement vertical standard avec marges équilibrées.
  - `fill` : Hauteur fixe 100% contenue sans débordement (tableaux de bord denses, interfaces cartographiques ou canevas).
- **Sécurité Anti-Blowout CSS Grid :** Empêche les éléments larges (tableaux, prévisualisations) de déborder grâce aux contraintes `min-w-0 min-h-0`.
- **Slots Structurés :** `#header`, `#toolbar`, `#filters`, `#sidebar`, `#footer`, et slot `#default`.

---

## Props

| Prop        | Type                                        | Défaut      | Description                          |
| :---------- | :------------------------------------------ | :---------- | :----------------------------------- |
| `mode`      | `'scroll' \| 'fill'`                        | `'scroll'`  | Mode de défilement                   |
| `maxWidth`  | `'default' \| 'narrow' \| 'wide' \| 'full'` | `'default'` | Contrainte de largeur maximale       |
| `noPadding` | `boolean`                                   | `false`     | Supprime les espacements horizontaux |
| `gap`       | `'none' \| 'sm' \| 'md' \| 'lg'`            | `'md'`      | Espacement entre blocs               |
| `class`     | `string`                                    | `undefined` | Classes CSS complémentaires          |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { PageLayout } from '@/components/ui/page-layout'
import { PageHeader } from '@/components/ui/page-header'
</script>

<template>
  <PageLayout mode="scroll" maxWidth="default">
    <template #header>
      <PageHeader title="Mon Titre" />
    </template>
    <div>Contenu de la page...</div>
  </PageLayout>
</template>
```
