# ProductTour

Adaptateur Vue 3.5 léger autour de Driver.js. Il affiche une visite guidée avec spotlight, progression, navigation clavier et mémorisation locale du premier passage.

```vue
<ProductTour
  ref="tourRef"
  :steps="[{ element: '#canvas', popover: { title: 'Canvas' } }]"
  auto-start
  storage-key="studio-tour.v1"
/>
```

La méthode exposée `start(stepIndex?)` permet de relancer la visite depuis un bouton d’aide. `reset()` efface uniquement la clé locale configurée.
