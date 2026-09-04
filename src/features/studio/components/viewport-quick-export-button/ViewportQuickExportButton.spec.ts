import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ViewportQuickExportButton from './ViewportQuickExportButton.vue'

const mocks = vi.hoisted(() => {
  return {
    endGesture: vi.fn(),
    captureCleanFrame: vi.fn(async (..._args: any[]) => 'data:image/png;base64,mocked1080p'),
    toastSuccess: vi.fn(),
    toastError: vi.fn()
  }
})

vi.mock('@/features/editor/stores/useEditorStore', () => ({
  useEditorStore: () => ({
    currentDocument: {
      name: 'Plateau Actu',
      camera: { enabled: true, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
      depthOfField: { enabled: false },
      colorGrading: { enabled: false },
      shaderSettings: { enabled: false },
      layers: [],
      groups: []
    },
    endGesture: mocks.endGesture
  })
}))

vi.mock('@/features/project/stores/useProjectStore', () => ({
  useProjectStore: () => ({
    currentProject: { stage: { width: 1792, height: 1024 } }
  })
}))

vi.mock('@/features/studio/composables/useHierarchyResolver', () => ({
  useHierarchyResolver: () => ({
    activeLayers: []
  })
}))

vi.mock('@/features/studio/composables/useCanvasRenderer', () => ({
  captureCleanFrame: mocks.captureCleanFrame
}))

vi.mock('@/ui/shared/services/toast.service', () => ({
  toast: {
    success: (...args: unknown[]) => mocks.toastSuccess(...args),
    error: (...args: unknown[]) => mocks.toastError(...args)
  }
}))

describe('ViewportQuickExportButton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('affiche le bouton en état initial idle avec icône image', () => {
    const wrapper = mount(ViewportQuickExportButton)
    const button = wrapper.find('[data-test="viewport-quick-export-btn"]')

    expect(button.exists()).toBe(true)
    expect(button.attributes('aria-label')).toContain('Export PNG rapide 1080p')
    expect(button.text()).toContain('image')
  })

  it('exécute l’export en 1080p avec succès, déclenche le téléchargement et affiche check', async () => {
    const wrapper = mount(ViewportQuickExportButton)
    const button = wrapper.find('[data-test="viewport-quick-export-btn"]')

    const linkClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    await button.trigger('click')
    await flushPromises()

    expect(mocks.endGesture).toHaveBeenCalled()
    expect(mocks.captureCleanFrame).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      'image/png',
      expect.objectContaining({
        camera: expect.objectContaining({ enabled: true }),
        outputResolution: expect.objectContaining({ width: 1920 })
      })
    )

    expect(linkClickSpy).toHaveBeenCalled()
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      'Rendu PNG 1080p exporté',
      expect.stringContaining('générée avec succès')
    )

    expect(wrapper.emitted('exported')?.[0]?.[0]).toBe('data:image/png;base64,mocked1080p')
    expect(button.text()).toContain('check')
    expect(button.attributes('aria-label')).toContain('exporté avec succès')

    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    expect(button.text()).toContain('image')
    linkClickSpy.mockRestore()
  })

  it('ne déclenche rien lorsque la prop disabled est active', async () => {
    const wrapper = mount(ViewportQuickExportButton, {
      props: { disabled: true }
    })
    const button = wrapper.find('[data-test="viewport-quick-export-btn"]')

    await button.trigger('click')
    await flushPromises()

    expect(mocks.captureCleanFrame).not.toHaveBeenCalled()
  })

  it('gère l’échec d’export avec affichage de l’état error', async () => {
    mocks.captureCleanFrame.mockRejectedValueOnce(new Error('Erreur export'))

    const wrapper = mount(ViewportQuickExportButton)
    const button = wrapper.find('[data-test="viewport-quick-export-btn"]')

    await button.trigger('click')
    await flushPromises()

    expect(mocks.toastError).toHaveBeenCalledWith('Échec de l’export PNG', 'Erreur export')
    expect(button.text()).toContain('close')

    vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    expect(button.text()).toContain('image')
  })
})
