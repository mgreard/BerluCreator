import { test, expect } from '@playwright/test'
import { openApp, openLibraryPane, openStudioPane } from './app-fixture'

test.describe('Audit UI - Parcours 1 : Calibrage de Rig & Parcours Utilisateur', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page)
  })

  test('L\'utilisateur peut ouvrir le calibrage, changer de corps, calibrer une tête et retourner au Studio', async ({ page }) => {
    // 1. Bouton "Calibrer un personnage" dans la barre d'outils
    const calibButton = page.locator('button[data-library-action="rigs"]')
    await expect(calibButton).toBeVisible()
    await calibButton.click()

    // 2. Vérification de l'ouverture du header HUD de calibration
    const header = page.locator('[data-testid="rig-calibration-header"]')
    await expect(header).toBeVisible()
    await expect(header).toContainText('Élément en cours')
    await expect(page.locator('[data-testid="rig-body-selector"]')).toBeVisible()

    // 3. Changement de corps dans le carrousel horizontal inférieur (Étape 1)
    const body2Btn = page.getByRole('button', { name: 'Body2', exact: true })
    await expect(body2Btn).toBeVisible()
    await body2Btn.click()

    // Le corps actif doit être mis en surbrillance
    await expect(body2Btn).toHaveAttribute('aria-pressed', 'true')

    // 4. Sélection d'une tête dans la bibliothèque d'assets à gauche (Étape 2)
    await openLibraryPane(page)
    const headsFilter = page.getByRole('button', { name: /Têtes/i }).first()
    if (await headsFilter.isVisible()) {
      await headsFilter.click()
    }
    const headCard = page.getByRole('option', { name: /Closeeyes head/i }).first()
    await expect(headCard).toBeVisible()
    await headCard.click()
    await openStudioPane(page)

    // 5. Vérification du HUD supérieur mis à jour (Étape 4)
    await expect(header).toContainText('Closeeyes head')
    const compatibleSwitch = page.locator('[data-testid="rig-calibration-header"] button[role="switch"]')
    await expect(compatibleSwitch).toBeVisible()

    // 6. Clic sur "Terminer" et retour propre au Studio
    const finishBtn = page.locator('[data-testid="rig-calibration-header"] button', { hasText: 'Terminer' })
    await expect(finishBtn).toBeVisible()
    await finishBtn.click()

    // Vérification que le viewport de calibration s'est fermé
    await expect(header).not.toBeVisible()
  })

  test('L\'utilisateur peut basculer la compatibilité d\'un asset sur un corps', async ({ page }) => {
    await page.locator('button[data-library-action="rigs"]').click()
    const header = page.locator('[data-testid="rig-calibration-header"]')
    await expect(header).toBeVisible()

    // Sélection d'une tête
    await openLibraryPane(page)
    const headCard = page.getByRole('option', { name: /head/i }).first()
    await headCard.click()
    await openStudioPane(page)

    // Switch "Compatible"
    const compatibleSwitch = page.locator('[data-testid="rig-calibration-header"] button[role="switch"]')
    await expect(compatibleSwitch).toBeVisible()
    const initialChecked = await compatibleSwitch.getAttribute('aria-checked')

    // Clic pour inverser
    await compatibleSwitch.click()
    const updatedChecked = await compatibleSwitch.getAttribute('aria-checked')
    expect(updatedChecked).not.toEqual(initialChecked)

    // Remettre dans l'état initial
    await compatibleSwitch.click()
    await page.locator('[data-testid="rig-calibration-header"] button', { hasText: 'Terminer' }).click()
  })
})
