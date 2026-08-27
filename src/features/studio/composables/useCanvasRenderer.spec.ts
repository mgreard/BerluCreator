import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StageSettings } from '@core/types/project.types'
import type { RenderableLayer } from './useHierarchyResolver'
import {
  captureCleanFrame,
  shouldFillExportBackground
} from './useCanvasRenderer'

const stage: StageSettings = {
  width: 1792,
  height: 1024,
  backgroundColor: '#0c0d14'
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('export du canvas', () => {
  it('préserve la transparence du PNG quand aucun calque background n’est visible', async () => {
    const fillRect = vi.fn()
    const clearRect = vi.fn()
    const context = {
      clearRect,
      fillRect,
      fillStyle: ''
    } as unknown as CanvasRenderingContext2D
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(context),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,transparent')
    } as unknown as HTMLCanvasElement
    const createElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) =>
      tagName === 'canvas' ? canvas : createElement(tagName, options)
    )

    await expect(captureCleanFrame([], stage, 'image/png')).resolves.toBe(
      'data:image/png;base64,transparent'
    )
    expect(clearRect).toHaveBeenCalledWith(0, 0, stage.width, stage.height)
    expect(fillRect).not.toHaveBeenCalled()
  })

  it('conserve un fond pour les formats sans canal alpha', () => {
    expect(shouldFillExportBackground([], 'image/jpeg')).toBe(true)
  })

  it('conserve le matte quand un calque background est visible', () => {
    const backgroundLayer = { category: 'background' } as RenderableLayer

    expect(shouldFillExportBackground([backgroundLayer], 'image/png')).toBe(true)
  })

  it('découpe la caméra puis rééchantillonne vers la résolution demandée', async () => {
    const sceneContext = {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: ''
    } as unknown as CanvasRenderingContext2D
    const exportDrawImage = vi.fn()
    const exportContext = {
      drawImage: exportDrawImage,
      imageSmoothingEnabled: false,
      imageSmoothingQuality: 'low'
    } as unknown as CanvasRenderingContext2D
    const sceneCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(sceneContext),
      toDataURL: vi.fn()
    } as unknown as HTMLCanvasElement
    const exportCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(exportContext),
      toDataURL: vi.fn().mockReturnValue('data:image/png;base64,framed')
    } as unknown as HTMLCanvasElement
    const canvases = [sceneCanvas, exportCanvas]
    const createElement = document.createElement.bind(document)

    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) =>
      tagName === 'canvas' ? canvases.shift()! : createElement(tagName, options)
    )

    await expect(captureCleanFrame([], stage, 'image/png', {
      camera: {
        enabled: true,
        x: 120,
        y: 0,
        width: 576,
        height: 1024,
        aspectRatio: '9:16'
      },
      outputResolution: { width: 1080, height: 1920 }
    })).resolves.toBe('data:image/png;base64,framed')

    expect(exportCanvas.width).toBe(1080)
    expect(exportCanvas.height).toBe(1920)
    expect(exportDrawImage).toHaveBeenCalledWith(
      sceneCanvas,
      120,
      0,
      576,
      1024,
      0,
      0,
      1080,
      1920
    )
  })
})
