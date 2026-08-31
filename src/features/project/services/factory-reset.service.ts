import { db } from '@infrastructure/db/dexie'

export const APPLICATION_STORAGE_KEYS = [
  'berlu.asset-sidebar-width',
  'berlu.asset-sidebar-width.v2',
  'berlu-creator.product-tour.v2',
  'berlu-creator.product-tour.v4',
  'berlu-creator:rig-profiles:v1',
  'berlu-creator:rig-catalog:v2',
  'berlu-creator:rig-catalog:v3',
  'berlu-creator:rig-catalog:v4',
  'berlu-creator:rig-catalog:v5',
  'berlu-creator:rig-catalog:v6',
  'berlu.rig-calibration-sidebar-width.v1',
  'mycomplib-theme'
] as const

/**
 * Supprime toutes les données persistées par BerluCreator.
 * Le prochain chargement réinitialise ensuite le projet et les assets de démonstration.
 */
export async function resetApplicationToFactoryDefaults(): Promise<void> {
  if (!db.isOpen()) {
    await db.open()
  }
  await Promise.all(db.tables.map((table) => table.clear()))

  if (typeof window === 'undefined') return
  for (const key of APPLICATION_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
}
