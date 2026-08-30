# VisualEffectsControls

Contenu métier pour les réglages occasionnels de colorimétrie Canvas 2D et les effets stylisés WebGL. La surface, le positionnement et la fermeture appartiennent au `Popover` qui le compose.

## API

```vue
<Popover title="Effets visuels" surface="glass">
  <template #trigger><Button>Effets</Button></template>
  <VisualEffectsControls
    v-model:color-grading="colorGrading"
    v-model:shader-settings="shaderSettings"
    @interaction-start="editor.beginGesture"
    @interaction-end="editor.endGesture"
    @reset-all="editor.resetVisualEffects"
  />
</Popover>
```

Les modèles restent séparés afin de conserver la persistance existante. Les événements d'interaction bornent un geste continu de slider à une seule entrée d'historique.
