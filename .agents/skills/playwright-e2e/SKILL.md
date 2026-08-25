---
name: playwright-e2e
description: Exécute les tests End-to-End Playwright et analyse les résultats de couverture ou les échecs de rendu. Utilise cette skill lorsque l'utilisateur demande de "lancer les tests", "vérifier la modale", ou "valider le scénario E2E".
requires:
  node: ">=20"
---

# Playwright E2E Skill

## Instructions de diagnostic
1. Exécute les tests locaux du projet avec `pnpm playwright test`.
2. Si Playwright génère une erreur de rendu visuel, tu es autorisé à ouvrir le navigateur Chrome intégré via le protocole d'Antigravity pour inspecter l'arborescence DOM accessible.
3. Si le test échoue à cause d'une transition asynchrone non résolue, conseille au développeur d'utiliser `onWatcherCleanup` dans ses watchers Vue 3.5 pour annuler proprement les requêtes réseau concurrentes au démontage du composant.
4. Rédige un rapport clair sous forme d'Artifact (Walkthrough) contenant :
   - Les spécifications validées.
   - Les erreurs interceptées et résolues.
   - Le statut final de la suite de tests (✅ ou 🛑).
