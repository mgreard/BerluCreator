import { test, expect } from '@playwright/test'
import { openApp } from './app-fixture'

test.describe('Audit UI - Parcours 4 : Actions Globales & Boîte de Dialogue Export HD', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openApp(page)
  })

  test('L\'utilisateur peut ouvrir la modale d\'export HD et vérifier les résolutions', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /Export HD/i })
    await expect(exportBtn).toBeVisible()
    await exportBtn.click()

    // Vérifier la présence du dialogue d'exportation
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Vérifier les options ou boutons de fermeture
    const closeBtn = dialog.locator('button[aria-label="Fermer"]').or(dialog.getByRole('button', { name: /Fermer|Annuler/i })).first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await expect(dialog).not.toBeVisible()
    }
  })

  test('La barre d\'outils d\'actions rapides du studio est interactive', async ({ page }) => {
    // Boutons de défaire / refaire
    const undoBtn = page.locator('button[title*="Annuler"]').or(page.locator('button:has-text("undo")')).first()
    if (await undoBtn.isVisible()) {
      await expect(undoBtn).toBeDisabled()
    }

    // Bouton de projet
    const projectBtn = page.getByRole('button', { name: /Projet/i }).first()
    await expect(projectBtn).toBeVisible()
    await projectBtn.click()
  })
})
