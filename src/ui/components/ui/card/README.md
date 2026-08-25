# Card

Composant conteneur de carte moderne avec verre dépoli (`glass`, `glass-interactive`, `glass-premium`), slots sémantiques (`header`, `default`, `footer`), conteneur adaptatif (`@container`), et accessibilité interactive (ARIA `role="button"` et clavier).

---

## Fonctionnalités

- **Variantes Visuelles :**
  - `default` : Aspect verre dépoli `glass` avec bordure lumineuse au survol.
  - `interactive` : Micro-interaction et élévation au survol/clic (`glass-interactive`).
  - `elevated` : Ombrage premium `glass-premium` pour éléments clés.
  - `flat` : Fond discret sans reflet pour sections secondaires.
- **Slots Structurés :** En-tête (`#header`), corps (`#default`) et pied de carte avec séparateur (`#footer`).
- **Polymorphisme :** Rendu configurable via `as` (`div`, `article`, `section`, `a`, `button`, etc.).
- **Classes consommateur :** La prop `class` accepte la syntaxe Vue complète (chaîne, tableau et objet conditionnel).

---

## Props

| Prop        | Type                                                 | Défaut      | Description                 |
| :---------- | :--------------------------------------------------- | :---------- | :-------------------------- |
| `as`        | `string \| object`                                   | `'div'`     | Balise HTML ou composant    |
| `variant`   | `'default' \| 'interactive' \| 'elevated' \| 'flat'` | `'default'` | Variante visuelle           |
| `padding`   | `'none' \| 'sm' \| 'md' \| 'lg'`                     | `'md'`      | Espacement interne          |
| `clickable` | `boolean`                                            | `false`     | Rend la carte cliquable     |
| `class`     | `HTMLAttributes['class']`                            | `undefined` | Classes Vue complémentaires |

---

## Emits

| Événement | Type de payload               | Description                        |
| :-------- | :---------------------------- | :--------------------------------- |
| `click`   | `MouseEvent \| KeyboardEvent` | Émis au clic ou validation clavier |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { Card } from '@/components/ui/card'
</script>

<template>
  <Card variant="elevated" padding="lg">
    <template #header>
      <h3 class="text-base font-bold">Titre de la carte</h3>
    </template>

    <p class="text-sm text-text-secondary">Contenu principal de la carte.</p>

    <template #footer>
      <span class="text-xs text-text-muted">Dernière mise à jour : il y a 2h</span>
    </template>
  </Card>
</template>
```
