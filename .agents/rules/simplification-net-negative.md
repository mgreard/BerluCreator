---
name: simplification-net-negative
description: Règle exigeant qu'une simplification ou refactorisation soit nette négative en volume de code.
alwaysApply: true
---

# Règle de Simplification Nette Négative

Toute tâche de « simplification », de « refactorisation » ou d'« assainissement » de code existant doit impérativement respecter les exigences suivantes :

1. **Bilan Lignes Net Négatif :** L'opération doit se traduire par une réduction nette du nombre total de lignes de code (`lines removed > lines added`), sauf si l'utilisateur demande explicitement l'ajout de nouveaux comportements, de nouvelles fonctionnalités ou de nouveaux tests.
2. **Interdiction de l'Over-Abstraction :** Ne pas découper prématurément un fichier volumineux fonctionnel en micro-fichiers ou couches indirectionnelles si ce découpage augmente le volume global ou la complexité d'orchestration.
3. **Périmètre Mort Strict :** Tout composant, helper, route ou export identifié comme orphelin doit être supprimé avec ses artefacts associés (tests, stories, types locaux, styles, README), sans laisser de code fantôme.
4. **Vérification Continue :** Vérifier que les commandes de build (`pnpm build`), typage (`pnpm typecheck`), stories (`pnpm story:build`) et E2E (`pnpm test:e2e`) restent parfaitement vertes après chaque élagage.
