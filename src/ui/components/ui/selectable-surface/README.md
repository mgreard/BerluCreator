# SelectableSurface

Primitive headless destinée aux cartes, lignes et éléments d'arbre sélectionnables. Elle centralise le focus, les états ARIA et l'activation au clavier tout en laissant le style au composant consommateur.

## Props

| Prop | Type | Défaut | Description |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `'div'` | Élément rendu |
| `selected` | `boolean` | `false` | État sélectionné |
| `disabled` | `boolean` | `false` | Désactive la surface |
| `role` | `'button' \| 'option' \| 'radio' \| 'treeitem' \| 'tab'` | `'option'` | Sémantique ARIA |
| `density` | `'default' \| 'compact'` | `'default'` | Hauteur et cible tactile |
| `class` | `HTMLAttributes['class']` | `undefined` | Classes de présentation |

La variante compacte conserve une surface visuelle de 32 px et étend sa cible tactile virtuelle à 44 px. Les touches Entrée et Espace émettent `click`; les événements provenant de contrôles enfants sont ignorés.

```vue
<SelectableSurface
  :selected="selectedId === item.id"
  density="compact"
  @click="selectedId = item.id"
>
  {{ item.label }}
</SelectableSurface>
```
