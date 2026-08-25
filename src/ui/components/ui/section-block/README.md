# SectionBlock

Composant de bloc de section encapsulé dans une carte `Card`, doté d'un en-tête structuré (`<h2>`, sous-titre, icône), d'un emplacement pour boutons d'actions et d'un corps avec container queries.

---

## Fonctionnalités

- **Encapsulation Structurée :** En-tête séparé avec bordure et fond contrasté, idéal pour les tableaux de bord.
- **Support des Slots Dédiés :** `#header`, `#actions`, et `#default`.
- **Adaptabilité `@container` :** Ajuste le padding et les tailles typographiques selon la largeur du conteneur.

---

## Props

| Prop       | Type     | Défaut      | Description                    |
| :--------- | :------- | :---------- | :----------------------------- |
| `title`    | `string` | `undefined` | Titre de la section `<h2>`     |
| `subtitle` | `string` | `undefined` | Sous-titre ou texte explicatif |
| `icon`     | `string` | `undefined` | Icône ou emoji décoratif       |
| `class`    | `string` | `undefined` | Classes CSS complémentaires    |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { SectionBlock } from '@/components/ui/section-block'
import { Button } from '@/components/ui/button'
</script>

<template>
  <SectionBlock title="Rapports d'activité" subtitle="Historique des exports" icon="📁">
    <template #actions>
      <Button size="xs" variant="ghost">Télécharger</Button>
    </template>
    <p>Contenu principal du bloc...</p>
  </SectionBlock>
</template>
```
