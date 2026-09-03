import type { Page } from '@playwright/test'

const PRODUCT_TOUR_STORAGE_KEYS = [
  'berlu.tour.studio.v2',
  'berlu.tour.rig.v1',
  'berlu.tour.snapshots.v1',
  'berlu.tour.export.v1'
]

export async function openApp(page: Page): Promise<void> {
  await page.addInitScript((storageKeys) => {
    for (const key of storageKeys) window.localStorage.setItem(key, 'true')
  }, PRODUCT_TOUR_STORAGE_KEYS)
  await page.goto('./')
  await page.waitForLoadState('networkidle')
}

export async function selectCharacter(page: Page, characterName: string): Promise<void> {
  await page.getByRole('combobox', { name: 'Personnage actif' }).click()
  await page.getByRole('option', { name: characterName, exact: true }).click()
}

export async function openLibraryPane(page: Page): Promise<void> {
  const compactNavigation = page.locator('[data-layout-region="compact-navigation"]')
  if (await compactNavigation.isVisible()) {
    await compactNavigation.getByRole('button', { name: 'Bibliothèque', exact: true }).click()
  }
}

export async function openStudioPane(page: Page): Promise<void> {
  const compactNavigation = page.locator('[data-layout-region="compact-navigation"]')
  if (await compactNavigation.isVisible()) {
    await compactNavigation.getByRole('button', { name: 'Studio', exact: true }).click()
  }
}
