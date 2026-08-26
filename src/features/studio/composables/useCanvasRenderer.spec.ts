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
  backgroundColor: '#0c0d14',
  safeArea: false,
  showGrid: false
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
})
