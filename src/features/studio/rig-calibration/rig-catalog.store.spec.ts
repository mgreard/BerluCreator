import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Asset, AssetCategory } from '@core/types/asset.types'
import { useRigCatalogStore } from './rig-catalog.store'

function asset(
  id: string,
  name: string,
  category: AssetCategory,
  width = 840,
  height = 908
): Asset {
  return {
    id,
    name,
    category,
    tags: [],
    blobId: `blob-${id}`,
    width,
    height,
    character: { key: 'berlu', name: 'Berlu', form: 'rig' },
    isMovable: false,
    createdAt: 1,
    updatedAt: 1
  }
}

const assets = [
  asset('body-a', 'Buste', 'body', 424, 838),
  asset('body-b', 'Corps complet', 'body', 1031, 812),
  asset('head-default', 'Tête par défaut', 'head', 260, 309),
  asset('head-variant', 'Tête variante', 'head', 280, 320),
  asset('arm-left', 'Bras gauche', 'arms_left', 150, 400)
]

describe('useRigCatalogStore (v3)', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('crée un rig par corps et exclut le corps de parts', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)

    expect(store.rigs).toHaveLength(2)
    for (const rig of store.rigs) {
      expect(rig.body).toBeDefined()
      expect(rig.bodyCalibration).toBeDefined()
      expect(rig.parts.some((p) => p.asset.category === 'body')).toBe(false)
    }
  })

  it('initialise un template de catégorie hérité par les pièces', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    const [bustRig] = store.rigs

    const headCat = bustRig!.categories.find((c) => c.category === 'head')
    expect(headCat?.enabled).toBe(true)
    expect(headCat?.template).toBeDefined()

    const headVariant = assets[3]!
    const effective = store.effectiveCalibrationForAsset(bustRig!, headVariant)
    expect(effective).toEqual(headCat?.template)
  })

  it('crée une surcharge pour une pièce non par défaut sans modifier le template', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    const [bustRig] = store.rigs
    const headDefault = assets[2]!
    const headVariant = assets[3]!

    // Modifier la tête variante (surcharge)
    store.savePartCalibration(bustRig!.id, headVariant, {
      x: 55,
      y: 77,
      scaleX: 1.2,
      scaleY: 1.2,
      rotation: 10
    })

    const partVariant = store.partForAsset(bustRig!, headVariant)
    expect(partVariant?.calibrationOverride).toEqual({
      x: 55,
      y: 77,
      scaleX: 1.2,
      scaleY: 1.2,
      rotation: 10
    })

    // Le template et la tête par défaut ne sont pas modifiés
    const headCat = bustRig!.categories.find((c) => c.category === 'head')
    expect(headCat?.template?.x).not.toBe(55)
    expect(store.effectiveCalibrationForAsset(bustRig!, headDefault)).toEqual(headCat?.template)

    // Reset restaure l'héritage
    store.resetPartCalibration(bustRig!.id, headVariant)
    expect(store.partForAsset(bustRig!, headVariant)?.calibrationOverride).toBeUndefined()
    expect(store.effectiveCalibrationForAsset(bustRig!, headVariant)).toEqual(headCat?.template)
  })

  it('modifier l’élément par défaut met à jour le template de la catégorie', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    const [bustRig] = store.rigs
    const headDefault = assets[2]!
    const headVariant = assets[3]!

    store.savePartCalibration(bustRig!.id, headDefault, {
      x: 105,
      y: 45,
      scaleX: 1.05,
      scaleY: 1.05,
      rotation: 0
    })

    const headCat = bustRig!.categories.find((c) => c.category === 'head')
    expect(headCat?.template).toEqual({
      x: 105,
      y: 45,
      scaleX: 1.05,
      scaleY: 1.05,
      rotation: 0
    })
    // La pièce variante sans surcharge hérite de la nouvelle valeur
    expect(store.effectiveCalibrationForAsset(bustRig!, headVariant)).toEqual(headCat?.template)
  })

  it('désactiver une catégorie rend ses pièces incompatibles et conserve les données dormantes', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    const [bustRig] = store.rigs
    const armLeft = assets[4]!

    expect(store.compatibleRigs(armLeft)).toHaveLength(2)

    // Désactiver arms_left sur le buste
    store.setCategoryEnabled(bustRig!.id, 'arms_left', false)
    expect(store.compatibleRigs(armLeft)).toHaveLength(1)
    expect(store.effectiveCalibrationForAsset(bustRig!, armLeft)).toBeNull()

    // Réactiver arms_left
    store.setCategoryEnabled(bustRig!.id, 'arms_left', true)
    expect(store.compatibleRigs(armLeft)).toHaveLength(2)
    expect(store.effectiveCalibrationForAsset(bustRig!, armLeft)).not.toBeNull()
  })

  it('duplique la configuration d’un rig vers un autre sans écraser le corps cible', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    const [bustRig, fullRig] = store.rigs

    // Personnaliser bustRig
    store.setCategoryEnabled(bustRig!.id, 'arms_left', false)
    store.savePartCalibration(bustRig!.id, assets[2]!, {
      x: 88,
      y: 99,
      scaleX: 1,
      scaleY: 1,
      rotation: 0
    })

    // Dupliquer vers fullRig
    store.duplicateRigConfiguration(bustRig!.id, fullRig!.id)

    const updatedFullRig = store.rigById(fullRig!.id)!
    expect(updatedFullRig.id).toBe(fullRig!.id)
    expect(updatedFullRig.body).toEqual(fullRig!.body)
    expect(updatedFullRig.bodyCalibration).toEqual(fullRig!.bodyCalibration)
    expect(updatedFullRig.categories.find((c) => c.category === 'arms_left')?.enabled).toBe(false)
    expect(updatedFullRig.categories.find((c) => c.category === 'head')?.template?.x).toBe(88)
  })

  it('propage un champ spécifique à tous les éléments d’une catégorie', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    const [bustRig] = store.rigs
    const headVariant = assets[3]!

    // Créer une surcharge sur la tête variante
    store.savePartCalibration(bustRig!.id, headVariant, {
      x: 10,
      y: 20,
      scaleX: 1.5,
      scaleY: 1.5,
      rotation: 5
    })

    // Propager seulement l'échelle (scale = 0.75) à toute la catégorie head
    store.propagateFieldToCategory(bustRig!.id, 'head', 'scale', 0.75)

    // Vérifier que le template a reçu l'échelle sans changer son X/Y
    const headCat = bustRig!.categories.find((c) => c.category === 'head')!
    expect(headCat.template?.scaleX).toBe(0.75)
    expect(headCat.template?.scaleY).toBe(0.75)

    // Vérifier que la surcharge conserve son X/Y/rotation personnalisés mais a reçu la nouvelle échelle
    const partVariant = store.partForAsset(bustRig!, headVariant)!
    expect(partVariant.calibrationOverride?.x).toBe(10)
    expect(partVariant.calibrationOverride?.y).toBe(20)
    expect(partVariant.calibrationOverride?.rotation).toBe(5)
    expect(partVariant.calibrationOverride?.scaleX).toBe(0.75)
    expect(partVariant.calibrationOverride?.scaleY).toBe(0.75)
  })

  it('exporte et réimporte la configuration v3', () => {
    const store = useRigCatalogStore()
    store.initialize(assets)
    store.setDefaultRig('berlu', store.rigs[1]!.id)
    const raw = JSON.stringify(store.exportCatalog())

    localStorage.clear()
    setActivePinia(createPinia())
    const restored = useRigCatalogStore()
    restored.importCatalog(raw, assets)

    expect(restored.rigs).toHaveLength(2)
    expect(restored.defaultRig('berlu')?.id).toBe(store.rigs[1]!.id)
    expect(restored.rigs[0].bodyCalibration).toBeDefined()
  })
})
