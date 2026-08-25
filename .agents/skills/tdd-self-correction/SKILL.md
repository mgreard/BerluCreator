---
name: tdd-self-correction
description: Exécute de manière autonome les tests Playwright locaux et auto-corrige les composants Vue en cas d'échec.
alwaysApply: false
commandExecutionPolicy: auto
---

# Skill: Boucle d'Auto-Correction Automatisée (Playwright)

Cette skill permet à l'agent de compiler, lancer et réparer les tests d'intégration sans solliciter l'utilisateur.

## Protocole de Test E2E
1. **Écriture :** Rédige les cas de test Playwright unifiés dans le dossier `tests/` ou colocalisés avec la feature.
2. **Ciblage Sémantique :** Utilise exclusivement les rôles ARIA (`page.getByRole('button', { name: '...' })`) ou les attributs d'état sémantiques de Reka (`data-state="open"`).
3. **Exécution :** Lance la suite de tests Playwright via :
   ```bash
   pnpm playwright test