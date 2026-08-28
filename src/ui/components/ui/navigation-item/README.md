# NavigationItem

Ligne de navigation sélectionnable pour les sidebars, listes de catégories et petits arbres. Elle compose `SelectableSurface`, `Icon` et `Badge`, et centralise les espacements, le focus, le compteur et l’accent coloré.

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `'button'` | Élément rendu |
| `label` | `string` | requis | Libellé tronqué de la ligne |
| `icon` | `string` | — | Icône Material Symbol |
| `count` | `string \| number` | — | Compteur affiché à droite |
| `selected` | `boolean` | `false` | État actif et `aria-pressed` |
| `disabled` | `boolean` | `false` | Désactive la ligne |
| `density` | `'default' \| 'compact'` | `'default'` | Espacements visuels |
| `accent` | `string` | `var(--color-primary)` | Couleur de l’état actif |
| `class` | `HTMLAttributes['class']` | — | Classes additionnelles |

## Slots

- `prefix` : contrôle placé avant l’icône, par exemple un bouton de dépliage.
- `icon` : remplace l’icône standard.
- `trailing` : remplace le compteur.

```vue
<NavigationItem
  label="Têtes"
  icon="face"
  :count="7"
  accent="#fb7185"
  :selected="category === 'head'"
  @click="category = 'head'"
/>
```
