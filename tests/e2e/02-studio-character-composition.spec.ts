import { test, expect } from '@playwright/test'
import { openApp, openLibraryPane, selectCharacter } from './app-fixture'

interface BrowserLayerState {
  category?: string
  transform?: { y?: number }
}

interface BrowserEditorState {
  currentDocument?: { layers?: BrowserLayerState[] }
}

interface BrowserPiniaState {
  _s: Map<string, BrowserEditorState>
}

interface VueAppHost extends HTMLElement {
  __vue_app__?: {
    config?: { globalProperties?: { $pinia?: BrowserPiniaState } }
  }
}

test.describe('Audit UI - Parcours 2 : Composition Personnage & Alignement Tête/Corps', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page)
  })

  test('Placement d\'un personnage et vérification de l\'alignement tête-corps sans décalage vertical', async ({ page }) => {
    // 1. Filtrer par l'onglet Personnages
    await openLibraryPane(page)
    const tabPerso = page.getByRole('tab', { name: /Personnages/i }).first()
    await expect(tabPerso).toBeVisible()
    await tabPerso.click()
    await selectCharacter(page, 'Berlu')

    // 2. Sélectionner Body1
    const bodyCard = page.getByRole('option', { name: /Body1/i }).first()
    await expect(bodyCard).toBeVisible()
    await bodyCard.click()

    // 3. Inspecter les couches dans l'état Pinia pour valider le calcul géométrique
    const layerTransforms = await page.evaluate(() => {
      const pinia = (document.querySelector('#app') as VueAppHost)?.__vue_app__?.config
        ?.globalProperties?.$pinia
      const editor = pinia?._s.get('editor')
      const bodyLayer = editor?.currentDocument?.layers?.find((layer) => layer.category === 'body')
      const headLayer = editor?.currentDocument?.layers?.find((layer) => layer.category === 'head')
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
    const cuteHeadCard = page.getByRole('option', { name: /Cute head/i }).first()
    if (await cuteHeadCard.isVisible()) {
      await cuteHeadCard.click()
      const updatedHeadTransform = await page.evaluate(() => {
        const pinia = (document.querySelector('#app') as VueAppHost)?.__vue_app__?.config
          ?.globalProperties?.$pinia
        const editor = pinia?._s.get('editor')
        return editor?.currentDocument?.layers?.find((layer) => layer.category === 'head')?.transform
      })
      expect(updatedHeadTransform.y).toBeGreaterThan(-800)
      expect(updatedHeadTransform.y).toBeLessThan(-500)
    }
  })

  test('Changement de bouche et superposition sur la tête active', async ({ page }) => {
    await openLibraryPane(page)
    await page.getByRole('tab', { name: /Personnages/i }).click()
    await selectCharacter(page, 'Berlu')
    await page.getByRole('option', { name: /Body1/i }).first().click()

    // 1. Ouvrir la catégorie Bouches
    const mouthFilter = page.getByRole('button', { name: /Bouches/i }).first()
    if (await mouthFilter.isVisible()) {
      await mouthFilter.click()
    }

    // 2. Sélectionner une bouche
    const mouthCard = page.getByRole('option', { name: /mouth/i }).first()
    await expect(mouthCard).toBeVisible()
    await mouthCard.click()

    // Vérifier que la bouche est bien instanciée comme couche dans le groupe personnage
    const hasMouthLayer = await page.evaluate(() => {
      const pinia = (document.querySelector('#app') as VueAppHost)?.__vue_app__?.config
        ?.globalProperties?.$pinia
      const editor = pinia?._s.get('editor')
      return editor?.currentDocument?.layers?.some((layer) => layer.category === 'mouth')
    })
    expect(hasMouthLayer).toBe(true)
  })
})
