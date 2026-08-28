# BerluCreator

BerluCreator est le projet technique derrière **Incroyaux News Studio**, un studio de composition graphique 2D dans le navigateur. Il permet de construire rapidement une image de plateau à partir de sprites de personnages et de décor, de conserver plusieurs compositions et d’exporter le résultat en PNG ou en JSON.

Le produit est aujourd’hui un **éditeur local mono-espace de travail** : les assets, la scène et les sauvegardes restent dans le navigateur grâce à IndexedDB. Il ne s’agit plus d’un séquenceur d’animation et il n’embarque ni compte utilisateur, ni cloud, ni collaboration temps réel.

## Documentation

- [Vision et cadre produit](docs/PRODUCT.md) — intention, utilisateurs, proposition de valeur, parcours, principes et limites.
- [Catalogue fonctionnel](docs/FEATURES.md) — comportement détaillé de chaque fonctionnalité et statut actuel.
- [Vue technique](docs/TECHNICAL_OVERVIEW.md) — architecture, modèle de données, persistance, rendu et commandes de développement.
- [Roadmap actuelle](ROADMAP.md) — architecture livrée, validations et dette connue.
- [Walkthrough d’implémentation](walkthrough.md) — détails de la simplification du studio et des migrations.

## État actuel

Version du package : `0.1.0`.

Le cœur du produit est utilisable : bibliothèque de sprites, import d’images, composition directe sur canvas, personnages complets ou assemblés, cadrage caméra, historique, compositions sauvegardées, sauvegarde locale complète et exports PNG/JSON.

Le positionnement reste celui d’un outil spécialisé et local. Les principales limites actuelles sont l’absence d’export/import d’une sauvegarde complète sous forme de fichier, l’absence de collaboration et la dépendance au stockage du navigateur.

## Démarrage local

Prérequis : une version récente de Node.js et `pnpm`.

```bash
pnpm install
pnpm run dev
```

L’application est servie par défaut sur `http://localhost:5173`.

## Commandes utiles

```bash
pnpm run dev          # serveur de développement Vite
pnpm run typecheck    # vérification TypeScript
pnpm run test:unit    # tests Vitest
pnpm run build        # typecheck de build + bundle de production
pnpm run story:dev    # catalogue Histoire de la bibliothèque UI
pnpm run story:build  # build statique du catalogue UI
```

`pnpm run lint` et `pnpm run format` modifient les fichiers ; utilisez-les volontairement.

## Structure du dépôt

```text
src/
├── core/             # contrats métier, catégories et constantes
├── features/         # assets, éditeur, projet et studio
├── infrastructure/   # IndexedDB/Dexie, repositories et cache de blobs
├── ui/               # bibliothèque de composants, styles et stories
├── assets/           # pack de sprites de démonstration et thème applicatif
└── App.vue           # composition du shell produit
```

Le détail des responsabilités et du flux de données se trouve dans la [vue technique](docs/TECHNICAL_OVERVIEW.md).
