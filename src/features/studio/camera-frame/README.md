# CameraFrameOverlay

Overlay de cadrage interactif pour une surface dont les coordonnées natives sont connues. Il fournit un masque extérieur à 60 %, huit poignées, le déplacement du cadre, les presets 16:9, 9:16, 1:1 et libre, ainsi qu’une remise à zéro.

Le `v-model` contient `x`, `y`, `width` et `height` en pixels natifs. L’événement `change` accompagne les interactions en direct et `commit` signale la fin d’un geste ou l’application d’un preset.

```vue
<CameraFrameOverlay
  v-model="camera"
  :stage-width="1920"
  :stage-height="1080"
  @commit="saveCamera"
/>
```
