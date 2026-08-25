# PageHeader

Composant d'en-tête de page standardisé avec titre sémantique `<h1>`, sous-titre explicatif, sur-titre de section (`sectionTitle`), icône/emoji visuel et zone d'actions alignée (`#actions`).

---

## Fonctionnalités

- **Hiérarchie Sémantique Pure :** Titre `<h1>` avec troncature intelligente, et textes secondaires basés sur nos tokens de typographie.
- **Container Queries `@container` :** Mise en page réactive automatique adaptant l'alignement des actions et la taille de typographie.
- **Zone d'Actions Modulaire :** Support de slots `#actions`, `#title`, `#subtitle`.

---

## Props

| Prop           | Type     | Défaut      | Description                          |
| :------------- | :------- | :---------- | :----------------------------------- |
| `title`        | `string` | `undefined` | Titre principal `<h1>`               |
| `subtitle`     | `string` | `undefined` | Description ou sous-titre de la page |
| `sectionTitle` | `string` | `undefined` | Sur-titre de catégorie               |
| `icon`         | `string` | `undefined` | Icône ou emoji en tête               |
| `class`        | `string` | `undefined` | Classes CSS complémentaires          |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
</script>

<template>
  <PageHeader
    title="Tableau de bord"
    subtitle="Suivez vos performances en direct."
    sectionTitle="Statistiques"
    icon="📊"
  >
    <template #actions>
      <Button variant="primary">Actualiser</Button>
    </template>
  </PageHeader>
</template>
```
