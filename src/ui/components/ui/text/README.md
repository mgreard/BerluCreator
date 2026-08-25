# Text

Composant textuel de base hautement personnalisable et polymorphe, intégrant les échelles typographiques, les couleurs de tokens OKLCH et le support du rendu headless.

---

## Fonctionnalités

- **Échelle typographique sémantique :** `lead`, `body`, `body-sm`, `caption`, `overline`, `code`.
- **Résolution automatique du tag :** Résout `p`, `span` ou `code` selon la variante choisie.
- **Surcharges typographiques :** Support explicite des graisses (`normal`, `medium`, `semibold`, `bold`) et des couleurs du thème.
- **Troncature flexible :** Troncature simple (`truncate: true`) ou sur plusieurs lignes (`truncate: 3`).

---

## Props

| Prop       | Type                                                                                                            | Défaut        | Description                             |
| :--------- | :-------------------------------------------------------------------------------------------------------------- | :------------ | :-------------------------------------- |
| `as`       | `string \| Component`                                                                                           | `auto`        | Balise HTML ou composant cible          |
| `variant`  | `'lead' \| 'body' \| 'body-sm' \| 'caption' \| 'overline' \| 'code'`                                            | `'body'`      | Variante typographique                  |
| `color`    | `'primary' \| 'secondary' \| 'muted' \| 'inverse' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'inherit'` | `'secondary'` | Couleur sémantique                      |
| `weight`   | `'normal' \| 'medium' \| 'semibold' \| 'bold'`                                                                  | `undefined`   | Graisse de police                       |
| `truncate` | `boolean \| number`                                                                                             | `false`       | Troncature simple ou multi-lignes       |
| `asChild`  | `boolean`                                                                                                       | `false`       | Rendu headless délégué à l'enfant       |
| `class`    | `string`                                                                                                        | `undefined`   | Classes CSS utilitaires complémentaires |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Text } from '@/components/ui/text'
</script>

<template>
  <Text variant="lead" color="primary"> Texte d'introduction mis en valeur. </Text>

  <Text variant="body" color="secondary" :truncate="2">
    Paragraphe standard avec limitation automatique à deux lignes.
  </Text>

  <Text variant="code"> npm run dev </Text>
</template>
```
