---
name: visual-animation-polish
description: Ajuste la fidélité visuelle, les micro-animations et les transitions physiques de nos composants en direct (HMR).
alwaysApply: false
---

# Skill: Polissage et Micro-Animations de Haute Volée

Cette skill encadre la direction artistique de nos composants d'interface.

## Principes de Rendu Visuel
- **Épaisseur du Verre :** Les opacités de fond pour l'effet de verre ne doivent jamais dépasser 35% (`rgba(..., 0.35)`) pour conserver une transparence cristalline et moderne.
- **Accroche Lumineuse :** Applique un reflet physique blanc subtil au bord supérieur (`box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`).
- **Cinématiques :** Utilise des transitions fluides et amorties (`transition-all duration-300 ease-out`) pour tous les changements d'états d'interaction (focus, survol, sélection).
- **Animations :** Utilise notre cinématique de lévitation subtile `animate-glass-float` pour les éléments flottants (Popovers, Tooltips) ou `shimmer-sweep` pour l'interactivité dynamique.