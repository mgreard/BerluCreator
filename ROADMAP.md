# Roadmap & Spécifications des Fonctionnalités

## Vue d'Ensemble

Ce document détaille la feuille de route technique et fonctionnelle pour le studio, couvrant la gestion des calques/groupes, le modèle de données autonome par snapshot pour les étapes (keyframes), l'ergonomie globale de l'interface, la préservation intuitive du focus/sélection et la refonte complète du module d'import d'assets.

---

## 1. Modèle de Données & Gestion des Keyframes (Snapshots Autonomes)

### 1.1 Snapshot Complet par Étape (Deep Copy / Zéro Héritage Fragile)
- [x] **Copie intégrale à la création :** À l'ajout ou duplication d'une étape (*keyframe*), cloner profondément (`structuredClone`) l'ensemble des états de pistes/assets de l'étape précédente vers la nouvelle étape à la même position.
- [x] **Autonomie totale des étapes :**
  - Supprimer tout mécanisme d'héritage d'état dynamique ou par référence entre étapes.
  - La suppression ou modification d'une étape d'origine ne doit en aucun cas impacter ou faire disparaître les assets des étapes suivantes ou dérivées.
- [x] **Persistance Dexie / IndexedDB :** Enregistrer chaque étape comme un snapshot sérialisé autonome.

### 1.2 Modèle Groupes & Catégories Multiples
- [x] **Découplage Groupe vs Catégorie :**
  - Un groupe peut contenir **une ou plusieurs catégories d'assets** (ex. le groupe `Berlu` encapsule les catégories `head`, `torso`, `arm_left`, `arm_right`, `presenter_prop`).
- [x] **Suppression des pistes libres :** Aucun asset ne peut exister en dehors d'un groupe.
- [x] **Règles d'affectation automatique à l'upload :**
  1. **Si un groupe est sélectionné :** L'asset uploadé est directement assigné à ce groupe cible.
  2. **Si aucun groupe n'est sélectionné :**
     - Si la catégorie correspond à un groupe par défaut $\rightarrow$ routage vers ce groupe par défaut.
     - Si la catégorie est personnalisée (ex. `Invité`) $\rightarrow$ vérification / création automatique du groupe correspondant et affectation de l'asset.
- [x] **Groupes par défaut prédéfinis :**
  - `background`
  - `Berlu` *(Présentateur — regroupe : bras, tête, torse, accessoires présentateur)*
  - `bureau`
  - `items de bureau`
  - `Accessoires de plateau`
- [x] **Affichage conditionnel :** Masquer les groupes par défaut vides dans l'UI (visibles uniquement s'ils contiennent au moins 1 asset).
- [x] **Création dynamique :** Permettre à l'utilisateur de créer de nouveaux groupes/catégories personnalisés.

---

## 2. Ergonomie, Cycle de Sélection & Focus

### 2.1 Persistance & Continuité de Sélection entre Keyframes
- [x] **Maintien du focus lors du changement de keyframe :** Lors de la navigation / sélection d'une autre keyframe, conserver l'élément ou le groupe actif si celui-ci existe dans la nouvelle étape.
- [x] **Maintien du focus à la création de keyframe :** À la création / duplication d'une nouvelle keyframe, préserver automatiquement la sélection active (groupe ou item) pour permettre d'enchaîner immédiatement les modifications d'assets sans re-sélection manuelle.
- [x] **Activation automatique à l'insertion d'asset :** Lorsqu'un utilisateur clique sur un asset dans la liste/sidebar de gauche pour l'injecter sur le canvas, cet asset individuel devient immédiatement **l'élément actif/sélectionné** sur le canvas (focus sur l'élément unitaire, et non sur le groupe entier).

### 2.2 Contrôle du Z-Index (Sidebar Droite)
- [x] **Édition directe :** Intégrer un champ numérique (*input number / stepper*) sur chaque item de la sidebar droite pour ajuster son `z-index`.
- [x] **Mise à jour réactive :** Réordonnancement immédiat dans le viewport transactionnel et enregistrement dans le snapshot du `stepId` actif.

### 2.3 Focus Post-Déplacement & Réorganisation
- [x] **Restauration du focus de groupe après manipulation :** Suite au déplacement (*drag & drop*) ou au réordonnancement d'un sprite au sein d'un groupe, rétablir automatiquement la sélection sur le **groupe parent**.

### 2.4 Ergonomie des Sidebars
- [x] **Boutons Expand / Collapse :** Retirer les boutons de repli de la barre flottante du viewport et les intégrer directement dans l'en-tête de leur sidebar respective (gauche et droite).

---

## 3. Refonte du Flux d'Import & Correctif Pipette

### 3.1 Problématiques Identifiées
* **Header surchargé :** Trop de contrôles concentrés dans l'en-tête avant sélection de fichier.
* **Instabilité de layout :** Sauts brutaux de dimensions de modale entre la zone de drop et la prévisualisation.
* **Bug d'échantillonnage pipette :** Découpe tronquée en angle droit liée à un canevas contraint par le conteneur CSS au lieu de la résolution source.
* **Intrusivité :** Fonctionnalité de suppression de fond monopolisant l'interface.

---

### 3.2 Spécifications Techniques

#### A. Correction de la Pipette (Canvas & Flood-Fill)
- [x] **Résolution native :** Initialiser le `<canvas>` hors-écran avec les dimensions intrinsèques de l'image source :
  $$\text{Largeur} = \text{image.naturalWidth}, \quad \text{Hauteur} = \text{image.naturalHeight}$$
- [x] **Mapping des coordonnées :** Convertir le clic écran vers l'espace de pixels natif :
  $$x_{\text{source}} = (x_{\text{click}} - \text{rect.left}) \times \left(\frac{\text{image.naturalWidth}}{\text{rect.width}}\right)$$
  $$y_{\text{source}} = (y_{\text{click}} - \text{rect.top}) \times \left(\frac{\text{image.naturalHeight}}{\text{rect.height}}\right)$$
- [x] **Traitement complet du buffer :** Appliquer le flood-fill / masque de tolérance sur l'intégralité du buffer pixel (`ImageData`).

#### B. Simplification du Workflow en 2 Phases (Modale Stable)
- [x] **Phase 1 — Sélection & Drop :**
  - Zone de drop épurée et centrée à dimension fixe.
  - Commutateur discret : **Images individuelles** | **Planche de sprites (Sprite Sheet)**.
  - Sélecteur de catégorie/groupe cible pré-positionné sur le groupe actif.
- [x] **Phase 2 — Prévisualisation & Outils :**
  - **Panneau latéral :** Miniatures des images importées avec action de suppression.
  - **Zone centrale :** Rendu clair de l'asset en haute fidélité.
  - **Barre d'outils contextuelle :** Bouton activable pour l'outil **Pipette** (slider de tolérance et swatch visibles uniquement à l'activation).

#### C. Nettoyage du Header de la Modale
- [x] Titre concis : **« Importer des assets »**.
- [x] Ne conserver que le sélecteur de groupe cible et le bouton de fermeture $(\times)$.