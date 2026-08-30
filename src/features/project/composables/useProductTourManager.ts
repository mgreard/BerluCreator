import { computed, ref, nextTick } from 'vue'
import { TOUR_DEFINITIONS, type TourKey } from '../services/tour-definitions'
import type { ProductTourExpose, ProductTourStep } from '@/components/ui/product-tour'

export function useProductTourManager(
  isRigCalibrationOpen: () => boolean,
  isSavedSnapshotsOpen: () => boolean,
  isExportOpen: () => boolean,
  callbacks: {
    openRigCalibration?: () => void
    openSavedSnapshots?: () => void
    openExport?: () => void
  } = {}
) {
  const currentTourKey = ref<TourKey>('studio-overview')
  const tourRef = ref<ProductTourExpose | null>(null)

  const activeContextTourKey = computed<TourKey>(() => {
    if (isExportOpen()) return 'export'
    if (isSavedSnapshotsOpen()) return 'saved-snapshots'
    if (isRigCalibrationOpen()) return 'rig-calibration'
    return 'studio-overview'
  })

  const currentTour = computed(() => TOUR_DEFINITIONS[currentTourKey.value])
  const activeContextTour = computed(() => TOUR_DEFINITIONS[activeContextTourKey.value])
  const currentSteps = computed<ProductTourStep[]>(() => currentTour.value.steps)
  const currentStorageKey = computed(() => currentTour.value.storageKey)

  async function startTour(key?: TourKey) {
    const targetKey = key ?? activeContextTourKey.value
    currentTourKey.value = targetKey

    // Préparer l'interface si le tour nécessite un panneau spécifique
    if (targetKey === 'rig-calibration' && !isRigCalibrationOpen()) {
      callbacks.openRigCalibration?.()
      await nextTick()
    } else if (targetKey === 'saved-snapshots' && !isSavedSnapshotsOpen()) {
      callbacks.openSavedSnapshots?.()
      await nextTick()
    } else if (targetKey === 'export' && !isExportOpen()) {
      callbacks.openExport?.()
      await nextTick()
    }

    // Le composant de visite reste monté : le prochain tick suffit pour recevoir
    // les nouvelles étapes et les éventuels panneaux ouverts ci-dessus.
    await nextTick()
    tourRef.value?.start()
  }

  return {
    currentTourKey,
    activeContextTourKey,
    currentTour,
    activeContextTour,
    currentSteps,
    currentStorageKey,
    tourRef,
    startTour
  }
}
