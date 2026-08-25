# MentionText & MentionChip

Composant d'analyse et d'affichage dynamique de texte enrichi avec tokens de mentions `@entity` (`@[type:id|Label]`), mappage de catégories avec couleurs et icônes, et puces interactives (`MentionChip`).

---

## Fonctionnalités

- **Parser d'Entités Regex :** Analyse automatiquement la syntaxe canonique `@[category:id|Label]` pour injecter des `MentionChip` stylisés dans le texte.
- **Thématisation par Catégorie :** Mappage des couleurs (`purple`, `amber`, `emerald`, `sky`, `rose`, `indigo`, `neutral`) et icônes Material Symbols par type d'entité.
- **Micro-Interactions et Accessibilité :** Événement `@mention-click` avec payload structuré (`id`, `type`, `label`, `event`), support du focus et de la navigation clavier.

---

## Props (MentionText)

| Prop          | Type                                 | Défaut      | Description                                 |
| :------------ | :----------------------------------- | :---------- | :------------------------------------------ |
| `text`        | `string`                             | `''`        | Texte brut contenant les tokens de mention  |
| `categories`  | `Record<string, MentionCategoryDef>` | `{}`        | Dictionnaire des types de mention et styles |
| `as`          | `string \| Component`                | `'p'`       | Élément conteneur racine                    |
| `interactive` | `boolean`                            | `true`      | Active les interactions au clic             |
| `parser`      | `(text) => MentionTextSegment[]`     | `undefined` | Adapte un format de token externe           |
| `size`        | `'sm' \| 'md'`                       | `'md'`      | Taille des puces                            |
| `class`       | `string`                             | `undefined` | Classes CSS complémentaires                 |

Le parseur injecté reste la frontière recommandée pour les formats métier : la bibliothèque rend des segments génériques, tandis que le consommateur conserve la résolution des identifiants, catégories et couleurs.

---

## Emits (MentionText)

| Événement       | Type de payload       | Description                  |
| :-------------- | :-------------------- | :--------------------------- |
| `mention-click` | `MentionClickPayload` | Émis au clic sur une mention |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import {
  MentionText,
  type MentionCategoryDef,
  type MentionClickPayload
} from '@/components/ui/mention-text'

const categories: Record<string, MentionCategoryDef> = {
  character: { color: 'purple', icon: 'person', label: 'Personnage' },
  location: { color: 'amber', icon: 'location_on', label: 'Lieu' }
}

const rawText = 'Bienvenue à @[location:paris|Paris], avec @[character:marie|Marie Curie].'

function handleMention(payload: MentionClickPayload) {
  console.log('Mention cliquée :', payload)
}
</script>

<template>
  <MentionText :text="rawText" :categories="categories" @mention-click="handleMention" />
</template>
```
