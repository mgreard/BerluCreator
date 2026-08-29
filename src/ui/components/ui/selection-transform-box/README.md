# SelectionTransformBox

Composant UI agnostique de boîte de sélection et de transformation interactive (déplacement, redimensionnement uniforme / libre, et rotation déportée style Canva / Figma).

## Fonctionnalités
- **Bordure de sélection** : Ligne contrastée (1.5px) avec couleur thématique configurable.
- **8 Poignées de redimensionnement** : 4 coins pour l'échelle uniforme/libre et 4 poignées latérales avec zones tactiles élargies (Fitts's Law).
- **Poignée de rotation déportée** : Tige verticale au-dessus du centre haut avec calcul trigonométrique continu de l'angle et magnétisme 15° avec la touche `Shift`.
- **HUD dynamique** : Info-bulle en temps réel pendant les manipulations (pixels, degrés, pourcentages).

## Usage
```vue
<SelectionTransformBox
  :width="260"
  :height="309"
  :x="x"
  :y="y"
  :scale="scale"
  :rotation="rotation"
  :active="true"
  @transform="onTransform"
  @transform-end="onTransformEnd"
>
  <img src="/head.png" class="h-full w-full object-contain" />
</SelectionTransformBox>
```
