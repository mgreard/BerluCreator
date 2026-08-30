# VisualEffectsOverlay

Panneau flottant unique pour les réglages occasionnels de colorimétrie Canvas 2D et les effets stylisés WebGL.

## API

```vue
<VisualEffectsOverlay
  v-model:color-grading="colorGrading"
  v-model:shader-settings="shaderSettings"
  v-model:open="isOpen"
  @interaction-start="editor.beginGesture"
  @interaction-end="editor.endGesture"
  @reset-all="editor.resetVisualEffects"
/>
```

Les modèles restent séparés afin de conserver la persistance existante. Les événements d'interaction bornent un geste continu de slider à une seule entrée d'historique.
