# Fieldset

Composant sémantique `<fieldset>` et `<legend>` permettant de regrouper logiquement des ensembles de champs de formulaires, avec description contextuelle, slot d'actions d'en-tête, et variantes visuelles (`default`, `card`, `ghost`).

---

## Fonctionnalités

- **Sémantique HTML5 Pure :** Utilise les balises `<fieldset>` et `<legend>` avec propagation native de l'attribut `disabled` à tous les champs enfants.
- **Variantes de Surface :**
  - `default` : Conteneur discret avec fond semi-transparent et bordure.
  - `card` : Effet de carte en verre dépoli (`glass-premium`) avec ombre portée.
  - `ghost` : Structure minimale sans cadre ni bordure.
- **Actions Dédiées :** Slot `#actions` aligné à droite dans la légende pour ajouter des boutons de réinitialisation ou d'aide.

---

## Props

| Prop          | Type                             | Défaut      | Description                               |
| :------------ | :------------------------------- | :---------- | :---------------------------------------- |
| `legend`      | `string`                         | `undefined` | Titre sémantique du groupe de champs      |
| `description` | `string`                         | `undefined` | Texte explicatif sous la légende          |
| `disabled`    | `boolean`                        | `false`     | Désactive le fieldset et tous ses enfants |
| `variant`     | `'default' \| 'card' \| 'ghost'` | `'default'` | Style visuel du conteneur                 |
| `class`       | `string`                         | `undefined` | Classes CSS complémentaires               |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Fieldset } from '@/components/ui/fieldset'
import { FormGroup } from '@/components/ui/form-group'
import { Input } from '@/components/ui/input'
</script>

<template>
  <Fieldset
    legend="Coordonnées"
    description="Renseignez vos informations de contact."
    variant="default"
  >
    <FormGroup label="Email">
      <Input type="email" />
    </FormGroup>
  </Fieldset>
</template>
```
