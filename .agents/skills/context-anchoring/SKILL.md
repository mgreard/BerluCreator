---
name: context-anchoring
description: Gère l'état et la mémoire de progression d'une fonctionnalité complexe (Feature-driven state persistence). Active cette skill au démarrage d'une nouvelle tâche ou fonctionnalité.
alwaysApply: false
---

# Skill: Ancrage de Contexte & Persistance d'État

Cette skill force l'agent à maintenir un journal de bord de session local et éphémère pour éviter la dégradation du contexte d'attention sur les longues tâches.

## Instructions d'Exécution

1. **Initialisation (Étape 1) :**
   - Crée ou lis un fichier nommé `.agy.local.md` à la racine (ajoute-le dans ton `.gitignore` pour ne pas polluer le dépôt).
   - Ce fichier doit contenir :
     ```markdown
     # Journal de Feature : [Nom de la Feature]
     - **Objectif Global :** ...
     - **État Actuel :** [En attente / En cours / Terminé]
     - **Décisions d'Architecture prises :** ...
     - **Reste à Faire (checklist) :** ...
     ```

2. **Mise à jour en cours de session :**
   - Après chaque étape majeure validée (compilation réussie, test au vert), mets à jour la checklist et l'état actuel dans `.agy.local.md`.
   - Avant de proposer de terminer, écris un résumé condensé de l'avancement dans ce fichier.

3. **Reprise de Contexte :**
   - Si tu démarres une nouvelle session et que `.agy.local.md` est présent, lis-le impérativement en premier lieu pour réhydrater tes objectifs sans demander de ré-explications à l'utilisateur.