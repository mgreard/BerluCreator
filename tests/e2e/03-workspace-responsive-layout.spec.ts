import { test, expect } from '@playwright/test'
import { openApp } from './app-fixture'

test.describe('Audit UI - Parcours 3 : Layout Responsive & Espaces de Travail', () => {
  test('En vue Bureau (1440x900), la bibliothèque et le studio sont simultanément visibles', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openApp(page)

    // La barre de navigation compacte (<1100px) doit être masquée
    const compactNav = page.locator('[data-layout-region="compact-navigation"]')
    await expect(compactNav).not.toBeVisible()

    // La bibliothèque latérale gauche doit être visible
    const leftSidebar = page.locator('[data-layout-region="left"]')
    await expect(leftSidebar).toBeVisible()

    // Le canvas du studio principal doit être visible
    const mainCanvas = page.locator('[data-layout-region="main"]')
    await expect(mainCanvas).toBeVisible()
  })

  test('En vue Tablette / Compact (< 1100px), la barre d\'onglets permet de basculer entre panneaux', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await openApp(page)

    // La navigation compacte doit être visible
    const compactNav = page.locator('[data-layout-region="compact-navigation"]')
    await expect(compactNav).toBeVisible()

    // Clic sur l'onglet "Bibliothèque"
    const libTab = compactNav.getByRole('button', { name: /Bibliothèque/i })
    await libTab.click()
    const leftSidebar = page.locator('[data-layout-region="left"]')
    await expect(leftSidebar).toBeVisible()

    // Clic sur l'onglet "Studio"
    const studioTab = compactNav.getByRole('button', { name: /Studio/i })
    await studioTab.click()
    const mainCanvas = page.locator('[data-layout-region="main"]')
    await expect(mainCanvas).toBeVisible()
  })
})
