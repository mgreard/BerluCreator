# EmptyState

Composant d'affichage d'état vide (aucune donnée, aucun résultat de recherche, initialisation d'espace), intégrant un conteneur en verre dépoli, support pour icônes ou emojis et boutons d'action d'accompagnement.

---

## Fonctionnalités

- **Conteneur Glassmorphic :** Rendu élégant avec bordure subtile et flou d'arrière-plan (`backdrop-blur-md`).
- **Support hybride d'icônes :** Détecte automatiquement les glyphes Material Symbols (ex: `'search_off'`, `'folder_open'`) ou les emojis / caractères graphiques (ex: `'📭'`, `'✦'`).
- **Zone d'appel à l'action :** Slot `#action` / slot par défaut pour inviter l'utilisateur à créer ou réinitialiser du contenu.

---

## Props

| Prop          | Type     | Défaut                   | Description                                    |
| :------------ | :------- | :----------------------- | :--------------------------------------------- |
| `icon`        | `string` | `'✦'`                    | Nom d'icône Material Symbol ou caractère/emoji |
| `title`       | `string` | `'Aucun élément trouvé'` | Titre principal de l'état vide                 |
| `description` | `string` | `undefined`              | Description textuelle explicative              |
| `class`       | `string` | `undefined`              | Classes CSS complémentaires                    |

---

## Slots

| Slot                 | Description                 |
| :------------------- | :-------------------------- |
| `default` / `action` | Boutons d'appel à l'action  |
| `title`              | Surcharge du titre          |
| `description`        | Surcharge de la description |
| `icon`               | Surcharge de l'icône        |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
</script>

<template>
  <EmptyState
    icon="folder_open"
    title="Aucun document"
    description="Vous n'avez pas encore téléversé de document dans ce dossier."
  >
    <template #action>
      <Button variant="primary">Téléverser un fichier</Button>
    </template>
  </EmptyState>
</template>
```
