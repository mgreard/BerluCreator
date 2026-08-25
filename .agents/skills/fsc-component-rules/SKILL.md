# Instructions de Conception pour Agent IA — Cadre FSC (Framework de Spécification de Composant) - v2

Ces instructions sont conçues pour être lues par un agent d'intelligence artificielle (comme Gemini Notebook, Claude Code, ou Cursor) travaillant sur le projet **MyCompLib**. Elles s'appuient sur l'architecture technique du projet (Vue 3.5+, Tailwind CSS v4, Reka UI, et Class Variance Authority) pour automatiser la génération de composants robustes, cohérents et exempts de défauts visuels.

---

## 1. POSTURE & OBJECTIFS DE CONCEPTION
En tant qu'agent de développement, tu dois aborder la création de chaque composant de manière systémique. Tu n'écris pas seulement du code réactif ; tu conçois une brique d'interface accessible, typée, responsive de manière autonome, visuellement cohérente et hautement interactive.

Pour chaque demande de création ou d'optimisation de composant UI, tu devez impérativement structurer ton analyse et ton implémentation autour du **FSC (Framework de Spécification de Composant)** qui comprend désormais cinq axes d'analyse fondamentaux.

---

## 2. LE CADRE D'ANALYSE FSC (LES 5 AXES)

### AXE A : SÉMANTIQUE & ARCHITECTURE HEADLESS
1. **Primitive Référente** : Identifie systématiquement si une primitive accessible de **Reka UI** (anciennement Radix Vue) ou **Zag.js** existe pour ce composant. Si oui, elle doit servir de fondation logique.
2. **Pattern de Composition (Compound Components)** : Privilégie la composition via slots et sous-composants (ex: `Card.Root`, `Card.Header`) au lieu d'un composant monolithique géré par des dizaines de props.
3. **Contrat d'API Vue 3.5** :
   - Liaison bidirectionnelle obligatoire via la macro native `defineModel()`.
   - Utilisation de `useTemplateRef()` pour l'accès typé aux éléments du DOM ou composants enfants.
   - Utilisation systématique de `onWatcherCleanup()` dans les watchers asynchrones pour éviter les fuites de mémoire.
   - Props destructurées réactives pour les valeurs par défaut.

### AXE B : ACCESSIBILITÉ, DESIGN TOKENS & COULEURS
1. **Gestion des Variantes (CVA)** : Utilise `class-variance-authority` pour structurer de manière déclarative les styles du composant (intentions, tailles, formes).
2. **Utilisation des Classes Utilitaires** : Interdiction absolue d'utiliser du CSS brut arbitraire. Utilise exclusivement les variables issues du `@theme` de Tailwind CSS v4 (ex: `bg-background`, `text-muted-foreground`, `border-border`).
3. **Contrastes Strict (WCAG 2.2)** :
   - Les **textes normaux** doivent respecter un ratio de contraste d'au moins **4.5:1** contre leur arrière-plan.
   - Les **textes grands (grandes polices)** et les **composants non textuels** (bordures d'inputs, icônes, boutons, dividers) doivent respecter un ratio de contraste d'au moins **3:1** (WCAG SC 1.4.11 / Contrast non-textuel).
   - Utilise le modificateur contextuel sémantique `on-*` (ex: `color-content-default-on-brand`) pour garantir des paires d'arrière-plans et premiers plans pré-validées.
4. **Fusion de Classes** : Permets la surcharge locale de styles en fusionnant la prop `class` externe avec les styles internes grâce au helper `cn()` (`clsx` + `tailwind-merge`).

### AXE C : ERGONOMIE, RESPONSIVE & SÉCURITÉ DE TRONCATURE (LONG TEXT)
1. **Confinement de Conteneur (Container Queries)** : Rends les composants de mise en page autonomes. Applique la classe `@container` sur la racine du composant et utilise les variantes de taille de conteneur (ex : `@md:grid-cols-2`, `@lg:p-6`) plutôt que les media queries de viewport (`md:`, `lg:`).
2. **Gestion des Textes Trop Longs (No Layout Blowout)** :
   - **Troncature Mono-ligne** : Pour empêcher que du texte dynamique ne déborde de ses limites horizontales, utilise l'utilitaire Tailwind `truncate` ou `whitespace-nowrap overflow-hidden text-ellipsis` (note : Tailwind v4 utilise désormais `text-ellipsis` et non plus `overflow-ellipsis`).
   - **Troncature Multi-ligne** : Utilise l'utilitaire `line-clamp-<number>` (ex: `line-clamp-2` ou `line-clamp-3`) pour limiter la hauteur des descriptions de cartes ou d'éléments textuels, avec un repli géré de manière sémantique ou une info-bulle d'accès au texte brut.
   - **Sécurité Flexbox/Grid** : Si `text-ellipsis` ne s'applique pas correctement et que le conteneur déborde, applique impérativement **`min-w-0`** (ou `shrink-0`) sur l'élément enfant de flexbox/grid contenant le texte tronqué. Cela désactive le `min-width: auto` par défaut des flex-items qui les empêche de se contracter en dessous de la taille brute de leur texte.
3. **Loi de Fitts (Cibles Mobiles)** : Garantis que toutes les cibles tactiles interactives fassent au minimum `44x44px` (ou `48x48px` selon la densité) en augmentant la zone de clic/toucher via du padding ou des marges internes invisibles.
4. **Loi de la Gestalt** : Assure-toi que la hiérarchie visuelle, le regroupement et les espacements (système de grille de pas de 8 pixels) traduisent logiquement la relation entre les informations.

### AXE D : CYCLE DE VIE DES 6 ÉTATS INTERACTIFS
Un composant interactif n'est jamais figé. Tu dois définir explicitement le style et le comportement pour ces 6 états :
1. **Repos (Default)** : Style stable, lisible et harmonieux.
2. **Survol (Hover)** : Feedback instantané (privilégier les légères variations de ton du thème OKLCH ou d'ombre, pas d'opacités brutales qui dégradent le contraste).
3. **Focus** : Ring de focus visible, épais et hautement contrasté pour la navigation au clavier (respect WCAG "Focus Not Obscured" 2.4.12).
4. **Activé / Pressé (Active)** : Sensation tactile d'enfoncement physique rapide (< 150ms).
5. **Désactivé (Disabled)** : Opacité réduite, curseur `cursor-not-allowed` et arrêt complet des interactions de pointeur. Fournir un message d'aide contextuel si l'état désactivé bloque une action critique.
6. **Chargement (Loading)** : Remplacement de l'état interactif par des micro-loaders ou skeleton states tout en préservant le contexte textuel originel (ex : "Sauvegarde en cours...").

### AXE E : COHÉRENCE VISUELLE GLOBALE & COMPOSITION (TAXONOMIE D1-D3)
Tirant profit de la recherche d'évaluation visuelle, l'agent doit valider les trois critères de composition visuelle :
1. **D1 Spacing Consistency (Régularité des espacements)** : Les marges, espacements, et `gap` entre éléments frères de même niveau dans une grille ou un flux de liste doivent être mathématiquement égaux (ex: utilisation uniforme de `gap-4` ou `space-y-3` basée sur notre pas de 8px).
2. **D2 Visual Balance (Équilibre de masse)** : Le poids visuel des éléments doit être équilibré sur la page. Éviter d'entasser tout le contenu sur un seul côté tout en laissant des espaces morts disproportionnés ou asymétriques.
3. **D3 Content-Container Fit (Adéquation Contenu-Conteneur)** : Le contenu textuel ou média doit s'intégrer parfaitement dans son conteneur parent. Aucun texte ne doit déborder horizontalement ou verticalement de manière tronquée brutalement, chevaucher un composant adjacent, ou flotter au milieu d'un conteneur absurdement surdimensionné sans intention de design.

---

## 3. CHECKLIST AVANT LIVRAISON (CRITÈRES DE QUALITÉ)
Avant de finaliser et de soumettre un composant, auto-évalue ton code avec cette checklist :
- [ ] Le code est-il strictement typé en TypeScript (sans recours à `any`) ?
- [ ] Le composant utilise-t-il `<script setup lang=\"ts\">` ?
- [ ] Est-ce que toutes les variables de thémage proviennent bien du design system Tailwind CSS v4 (sans hardcoding) ?
- [ ] Le composant gère-t-il correctement la navigation au clavier (touches Tab, Enter, Space, flèches directionnelles si applicable) ?
- [ ] Les transitions CSS durent-elles toutes entre 150ms et 300ms pour une réactivité optimale ?
- [ ] Les textes longs ou de longueur imprévisible disposent-ils d'une troncature sécurisée (`truncate`, `min-w-0`) ?
- [ ] Tous les contrastes de couleur texte (>= 4.5:1) et éléments non-textuels (>= 3:1) ont-ils été respectés ?
