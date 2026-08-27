# Roadmap & Architecture du Studio

## Vue d'Ensemble

Ce document résume l'architecture technique et fonctionnelle du studio **BerluCreator**, conçu selon un modèle d'**Éditeur Unique** (Single-Scene Document Editor) centré sur la composition directe, sans timeline, pistes ou keyframes.

---

## 1. Modèle de Données & Éditeur Unique

### 1.1 Document Unique (`EditorDocument`)
- [x] **Scène plate et directe :** Un document contient une liste de calques (`EditorLayer`), une liste de groupes (`EditorGroup`), et un cadrage caméra global (`CameraFrame`).
- [x] **Zéro concept de timeline :** Pas de pistes, d'étapes multiples (`stepId`), d'interpolation ou de complexité de transition.
- [x] **Cardinalités de calques :**
  - Catégories *singleton* (ex : torse, tête, yeux, bouche, fond, bureau) : un seul calque actif à la fois par groupe (remplacement automatique lors de l'ajout).
  - Catégories *multi* (ex : accessoires, bras, premier plan) : accumulation libre de plusieurs calques simultanés avec z-index et ordre ajustables.
- [x] **Persistance Dexie v4 :** Stockage direct dans la table `editorDocuments` avec mise à jour réactive et sauvegarde globale de l'espace de travail.

### 1.2 Groupes & Organisation Hiérarchique
- [x] **Découplage Groupe vs Catégorie :** Les groupes structurent les éléments sur le plateau (ex : `Berlu`, `Bureau`, `Décor`).
- [x] **Transformations parent/enfant :** Déplacement ou redimensionnement d'un groupe appliquant sa matrice à tous ses calques enfants.
- [x] **Groupes personnalisés :** Création et suppression de groupes avec sélection et boîte de confirmation.

---

## 2. Viewport & Gestuelle Directe

### 2.1 Manipulation sur Canvas
- [x] **Hit-testing précis :** Détection d'éléments opaques par test alpha sur le canvas.
- [x] **Boîte englobante & 8 poignées :** Redimensionnement avec préservation du ratio ou par axe (corners & edges).
- [x] **Historique transactionnel :** Gestes de transformation avec support complet de Undo/Redo (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z`) et validation explicite.
- [x] **Cadrage Caméra :** Overlay de cadrage libre avec ratios prédéfinis (16:9, 9:16, 1:1, etc.).

### 2.2 Vues Sauvegardées (`ViewportSnapshot`)
- [x] **Capture de compositions :** Enregistrement de l'état complet du viewport (calques, groupes, cadrage caméra) sous forme de composition nommée avec miniature visuelle.
- [x] **Restauration atomique :** Chargement instantané d'une composition sauvegardée remplaçant le document actif.

---

## 3. Import & Export Pass-Through

### 3.1 Import Pass-Through Strict
- [x] **1 Fichier = 1 Sprite :** Conservation intégrale des dimensions et pixels d'origine sans altération ni recadrage transparent.
- [x] **Glisser-déposer multiple :** Choix de la catégorie et du groupe cible avec prévisualisation et attribution automatique.

### 3.2 Export Simplifié
- [x] **Rendu PNG haute qualité :** Export de l'état visible du plateau avec prise en compte du cadrage caméra (résolution native ou 1080p).
- [x] **Structure de scène JSON :** Téléchargement de la description du document et des métadonnées des sprites.