import { test, expect } from '@playwright/test'

test.describe('Audit UI - Parcours 2 : Composition Personnage & Alignement Tête/Corps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./')
    await page.waitForLoadState('networkidle')
  })

  test('Placement d\'un personnage et vérification de l\'alignement tête-corps sans décalage vertical', async ({ page }) => {
    // 1. Filtrer par l'onglet Personnages
    const tabPerso = page.getByRole('button', { name: /Personnages/i }).first()
    await expect(tabPerso).toBeVisible()
    await tabPerso.click()

    // 2. Sélectionner Body1
    const bodyCard = page.locator('.asset-grid > div', { hasText: 'Body1' }).first()
    await expect(bodyCard).toBeVisible()
    await bodyCard.click()

    // 3. Inspecter les couches dans l'état Pinia pour valider le calcul géométrique
    const layerTransforms = await page.evaluate(() => {
      const pinia = (document.querySelector('#app') as any)?.__vue_app__?.config?.globalProperties?.$pinia
      const editor = pinia?._s.get('editor')
      const bodyLayer = editor?.currentDocument?.layers?.find((l: any) => l.category === 'body')
      const headLayer = editor?.currentDocument?.layers?.find((l: any) => l.category === 'head')
      return {
        body: bodyLayer?.transform,
        head: headLayer?.transform
      }
    })

    expect(layerTransforms.body).toBeDefined()
    expect(layerTransforms.head).toBeDefined()

    // Le décalage vertical de la tête doit correspondre au cou moins la demi-hauteur (centré sur le cou)
    // Au lieu de l'ancien bug à -1220.7, la valeur doit être proche de -646.5
    expect(layerTransforms.head.y).toBeGreaterThan(-800)
    expect(layerTransforms.head.y).toBeLessThan(-500)

    // 4. Permutation dynamique de tête
    const cuteHeadCard = page.locator('.asset-grid > div', { hasText: 'Cute head' }).first()
    if (await cuteHeadCard.isVisible()) {
      await cuteHeadCard.click()
      const updatedHeadTransform = await page.evaluate(() => {
        const pinia = (document.querySelector('#app') as any)?.__vue_app__?.config?.globalProperties?.$pinia
        const editor = pinia?._s.get('editor')
        return editor?.currentDocument?.layers?.find((l: any) => l.category === 'head')?.transform
      })
      expect(updatedHeadTransform.y).toBeGreaterThan(-800)
      expect(updatedHeadTransform.y).toBeLessThan(-500)
    }
  })

  test('Changement de bouche et superposition sur la tête active', async ({ page }) => {
    // 1. Ouvrir la catégorie Bouches
    const mouthFilter = page.getByRole('button', { name: /Bouches/i }).first()
    if (await mouthFilter.isVisible()) {
      await mouthFilter.click()
    }

    // 2. Sélectionner une bouche
    const mouthCard = page.locator('.asset-grid > div', { hasText: /mouth/i }).first()
    if (await mouthCard.isVisible()) {
      await mouthCard.click()

      // Vérifier que la bouche est bien instanciée comme couche dans le groupe personnage
      const hasMouthLayer = await page.evaluate(() => {
        const pinia = (document.querySelector('#app') as any)?.__vue_app__?.config?.globalProperties?.$pinia
        const editor = pinia?._s.get('editor')
        return editor?.currentDocument?.layers?.some((l: any) => l.category === 'mouth')
      })
      expect(hasMouthLayer).toBe(true)
    }
  })
})
