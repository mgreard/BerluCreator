# FloatingGlassPanel

Surface glassmorphism déplaçable et accessible pour les outils contextuels du Studio.

- Se téléporte dans `#studio-overlay-host`.
- Se replace selon `defaultPlacement` à chaque ouverture.
- Reste entièrement contenue dans l’hôte et rend son contenu scrollable si nécessaire.
- Supporte un chrome de panneau avec en-tête ou une barre compacte.
- Le parent conserve la responsabilité de n’ouvrir qu’un panneau Studio à la fois.
