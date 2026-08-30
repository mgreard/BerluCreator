import { describe, expect, it, vi } from 'vitest'
import { useProductTourManager } from './useProductTourManager'

describe('useProductTourManager', () => {
  it('détecte le contexte studio par défaut', () => {
    const manager = useProductTourManager(
      () => false,
      () => false,
      () => false
    )

    expect(manager.activeContextTourKey.value).toBe('studio-overview')
    expect(manager.activeContextTour.value.title).toBe('Studio & Viewport')
    expect(manager.currentSteps.value.length).toBeGreaterThan(0)
  })

  it('détecte le contexte de calibrage de rig lorsque le panneau est ouvert', () => {
    const manager = useProductTourManager(
      () => true,
      () => false,
      () => false
    )

    expect(manager.activeContextTourKey.value).toBe('rig-calibration')
    expect(manager.activeContextTour.value.title).toBe('Calibrage de personnage')
  })

  it('détecte le contexte des snapshots lorsque le panneau est ouvert', () => {
    const manager = useProductTourManager(
      () => false,
      () => true,
      () => false
    )

    expect(manager.activeContextTourKey.value).toBe('saved-snapshots')
    expect(manager.activeContextTour.value.title).toBe('Vues sauvegardées')
  })

  it('ouvre automatiquement le panneau correspondant lors du lancement forcé d’un tour', async () => {
    const openRigCalibration = vi.fn()
    const openSavedSnapshots = vi.fn()
    const openExport = vi.fn()

    const manager = useProductTourManager(
      () => false,
      () => false,
      () => false,
      {
        openRigCalibration,
        openSavedSnapshots,
        openExport
      }
    )
    const start = vi.fn()
    manager.tourRef.value = { start, reset: vi.fn() }

    await manager.startTour('rig-calibration')
    expect(openRigCalibration).toHaveBeenCalled()
    expect(manager.currentTourKey.value).toBe('rig-calibration')
    expect(start).toHaveBeenCalledTimes(1)

    await manager.startTour('export')
    expect(openExport).toHaveBeenCalled()
    expect(manager.currentTourKey.value).toBe('export')
    expect(start).toHaveBeenCalledTimes(2)
  })
})
