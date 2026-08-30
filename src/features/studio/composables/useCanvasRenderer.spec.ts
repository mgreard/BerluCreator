import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StageSettings } from '@core/types/project.types'
import type { RenderableLayer } from './useHierarchyResolver'
import {
  captureCleanFrame,
  drawSceneLayersOnContext,
  shouldApplyDepthOfField,
  shouldFillExportBackground
} from './useCanvasRenderer'
import {
  DEFAULT_COLOR_GRADING_SETTINGS,
  DEFAULT_DEPTH_OF_FIELD_SETTINGS,
  DEFAULT_SHADER_SETTINGS
} from '@core/constants/editor'
import * as shaderEngine from '../engine/post-processing-shader.engine'

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

    await expect(
      captureCleanFrame([], stage, 'image/png', {
        camera: {
          enabled: true,
          x: 120,
          y: 0,
          width: 576,
          height: 1024,
          aspectRatio: '9:16'
        },
        outputResolution: { width: 1080, height: 1920 }
      })
    ).resolves.toBe('data:image/png;base64,framed')

    expect(exportCanvas.width).toBe(1080)
    expect(exportCanvas.height).toBe(1920)
    expect(exportDrawImage).toHaveBeenCalledWith(sceneCanvas, 120, 0, 576, 1024, 0, 0, 1080, 1920)
  })

  it('compose le grading avant le shader et conserve le matte', () => {
    const contextFactory = () => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      filter: 'none',
      globalCompositeOperation: 'source-over',
      globalAlpha: 1
    }) as unknown as CanvasRenderingContext2D
    const rawContext = contextFactory()
    const gradedContext = contextFactory()
    const shaderContext = contextFactory()
    const targetContext = contextFactory()
    const rawCanvas = { width: 0, height: 0, getContext: vi.fn(() => rawContext) }
    const gradedCanvas = { width: 0, height: 0, getContext: vi.fn(() => gradedContext) }
    const shaderCanvas = { width: 0, height: 0, getContext: vi.fn(() => shaderContext) }
    const canvases = [rawCanvas, gradedCanvas, shaderCanvas]
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) =>
      tagName === 'canvas'
        ? (canvases.shift() as unknown as HTMLCanvasElement)
        : createElement(tagName, options)
    )
    const applyShader = vi
      .spyOn(shaderEngine, 'applyPostProcessingShader')
      .mockReturnValue('applied')

    const status = drawSceneLayersOnContext(
      targetContext,
      [],
      320,
      180,
      DEFAULT_DEPTH_OF_FIELD_SETTINGS,
      new Map(),
      { ...DEFAULT_COLOR_GRADING_SETTINGS, enabled: true, preset: 'warm', temperature: 18 },
      { ...DEFAULT_SHADER_SETTINGS, enabled: true, preset: 'vignette', vignette: 5 },
      { backgroundColor: '#123456' }
    )

    expect(status).toBe('applied')
    expect(rawContext.fillRect).toHaveBeenCalledWith(0, 0, 320, 180)
    expect(gradedContext.drawImage).toHaveBeenCalledWith(rawCanvas, 0, 0, 320, 180)
    expect(gradedContext.filter).toBe('none')
    expect(applyShader.mock.calls[0]?.[0]).toBe(gradedCanvas)
    expect(applyShader.mock.calls[0]?.[1]).not.toBe(targetContext)
    expect(applyShader.mock.calls[0]?.[2]).toMatchObject({ preset: 'vignette' })
    expect(targetContext.drawImage).toHaveBeenCalledWith(shaderCanvas, 0, 0, 320, 180)
  })

  it('applique les effets spatiaux dans le cadre caméra recadré', () => {
    const contextFactory = () => ({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      fillStyle: '',
      filter: 'none',
      globalCompositeOperation: 'source-over',
      globalAlpha: 1
    }) as unknown as CanvasRenderingContext2D
    const contexts = [contextFactory(), contextFactory(), contextFactory(), contextFactory()]
    const canvases = contexts.map((context) => ({
      width: 0,
      height: 0,
      getContext: vi.fn(() => context)
    }))
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) =>
      tagName === 'canvas'
        ? (canvases.shift() as unknown as HTMLCanvasElement)
        : createElement(tagName, options)
    )
    const applyShader = vi
      .spyOn(shaderEngine, 'applyPostProcessingShader')
      .mockReturnValue('applied')
    const target = contextFactory()

    drawSceneLayersOnContext(
      target,
      [],
      321,
      181,
      DEFAULT_DEPTH_OF_FIELD_SETTINGS,
      new Map(),
      DEFAULT_COLOR_GRADING_SETTINGS,
      { ...DEFAULT_SHADER_SETTINGS, enabled: true, preset: 'vignette', vignette: 5 },
      { shaderFrame: { x: 20, y: 10, width: 100, height: 50 }, backgroundColor: null }
    )

    const shaderSource = applyShader.mock.calls[0]?.[0]
    expect(shaderSource).toMatchObject({ width: 100, height: 50 })
    expect(target.drawImage).toHaveBeenLastCalledWith(
      expect.objectContaining({ width: 100, height: 50 }),
      20,
      10,
      100,
      50
    )
  })
})

describe('profondeur de champ', () => {
  const backgroundLayer = {
    category: 'background',
    asset: { blobId: 'blob-background' }
  } as RenderableLayer

  it('ne s’applique que lorsqu’elle est active, non nulle et possède un arrière-plan', () => {
    expect(
      shouldApplyDepthOfField([backgroundLayer], {
        ...DEFAULT_DEPTH_OF_FIELD_SETTINGS,
        enabled: true
      })
    ).toBe(true)
    expect(shouldApplyDepthOfField([backgroundLayer], DEFAULT_DEPTH_OF_FIELD_SETTINGS)).toBe(false)
    expect(
      shouldApplyDepthOfField([backgroundLayer], {
        ...DEFAULT_DEPTH_OF_FIELD_SETTINGS,
        enabled: true,
        blurRadius: 0
      })
    ).toBe(false)
    expect(shouldApplyDepthOfField([], { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true })).toBe(
      false
    )
    expect(
      shouldApplyDepthOfField(
        [{ ...backgroundLayer, category: 'props_set', depthRole: 'background' }],
        { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true }
      )
    ).toBe(true)
    expect(
      shouldApplyDepthOfField([{ ...backgroundLayer, depthRole: 'subject' }], {
        ...DEFAULT_DEPTH_OF_FIELD_SETTINGS,
        enabled: true
      })
    ).toBe(false)
    expect(
      shouldApplyDepthOfField(
        [{ ...backgroundLayer, category: 'foreground', depthRole: 'background' }],
        { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true }
      )
    ).toBe(false)
    expect(
      shouldApplyDepthOfField(
        [{ ...backgroundLayer, category: 'foreground', opticalDepth: 0.65 }],
        { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true }
      )
    ).toBe(true)
    expect(
      shouldApplyDepthOfField(
        [{ ...backgroundLayer, category: 'props_set', opticalDepth: 0.5 }],
        { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true }
      )
    ).toBe(false)
  })

  it('n’alloue aucun canvas temporaire lorsqu’elle est désactivée', () => {
    const createElement = vi.spyOn(document, 'createElement')
    const context = {} as CanvasRenderingContext2D

    drawSceneLayersOnContext(
      context,
      [backgroundLayer],
      stage.width,
      stage.height,
      DEFAULT_DEPTH_OF_FIELD_SETTINGS,
      new Map()
    )

    expect(createElement).not.toHaveBeenCalled()
  })

  it('floute seulement l’arrière-plan et réutilise ses buffers', () => {
    const gradient = { addColorStop: vi.fn() }
    const contextFactory = () =>
      ({
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        translate: vi.fn(),
        createLinearGradient: vi.fn(() => gradient),
        filter: 'none',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        fillStyle: ''
      }) as unknown as CanvasRenderingContext2D
    const sharpContext = contextFactory()
    const blurredContext = contextFactory()
    const maskedContext = contextFactory()
    const mainContext = contextFactory()
    const mainDrawImage = vi.mocked(mainContext.drawImage)
    const canvases = [
      { width: 0, height: 0, getContext: vi.fn(() => sharpContext) },
      { width: 0, height: 0, getContext: vi.fn(() => blurredContext) },
      { width: 0, height: 0, getContext: vi.fn(() => maskedContext) }
    ] as unknown as HTMLCanvasElement[]
    const createElement = document.createElement.bind(document)
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName, options) =>
        tagName === 'canvas' ? canvases.shift()! : createElement(tagName, options)
      )
    const image = {
      complete: true,
      naturalWidth: 100
    } as HTMLImageElement
    const renderable = {
      ...backgroundLayer,
      opacity: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      transformOriginX: 50,
      transformOriginY: 50,
      x: 0,
      y: 0,
      width: 100,
      height: 100
    } as RenderableLayer
    const protectedLayer = {
      ...renderable,
      category: 'character_full',
      asset: { blobId: 'blob-character' }
    } as RenderableLayer
    const imageCache = new Map([
      ['blob-background', image],
      ['blob-character', image]
    ])
    const settings = { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true }

    drawSceneLayersOnContext(
      mainContext,
      [renderable, protectedLayer],
      321,
      123,
      settings,
      imageCache
    )
    drawSceneLayersOnContext(
      mainContext,
      [renderable, protectedLayer],
      321,
      123,
      settings,
      imageCache
    )

    const changedSettings = { ...settings, focusY: 0.5 }
    drawSceneLayersOnContext(
      mainContext,
      [renderable, protectedLayer],
      321,
      123,
      changedSettings,
      imageCache
    )

    expect(createElementSpy).toHaveBeenCalledTimes(3)
    expect(blurredContext.drawImage).toHaveBeenCalledTimes(1)
    expect(maskedContext.drawImage).toHaveBeenCalledTimes(2)
    expect(maskedContext.createLinearGradient).toHaveBeenCalledTimes(2)
    expect(sharpContext.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      96,
      96,
      1,
      123,
      0,
      96,
      96,
      123
    )
    expect(mainContext.drawImage).toHaveBeenCalledWith(image, 0, 0, 100, 100)

    mainDrawImage.mockClear()
    drawSceneLayersOnContext(
      mainContext,
      [protectedLayer, renderable],
      321,
      123,
      settings,
      imageCache
    )

    expect(mainDrawImage.mock.calls[0]?.[0]).toBe(image)
  })

  it('inverse le masque sous la ligne pour un premier plan proche', () => {
    const gradient = { addColorStop: vi.fn() }
    const contextFactory = () =>
      ({
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        translate: vi.fn(),
        createLinearGradient: vi.fn(() => gradient),
        filter: 'none',
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
        fillStyle: ''
      }) as unknown as CanvasRenderingContext2D
    const contexts = [contextFactory(), contextFactory(), contextFactory()]
    const canvases = contexts.map((context) => ({
      width: 0,
      height: 0,
      getContext: vi.fn(() => context)
    })) as unknown as HTMLCanvasElement[]
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) =>
      tagName === 'canvas' ? canvases.shift()! : createElement(tagName, options)
    )
    const image = { complete: true, naturalWidth: 100 } as HTMLImageElement
    const foreground = {
      ...backgroundLayer,
      category: 'foreground',
      opticalDepth: 0.65,
      opacity: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      transformOriginX: 50,
      transformOriginY: 50,
      x: 0,
      y: 0,
      width: 100,
      height: 100
    } as RenderableLayer

    drawSceneLayersOnContext(
      contextFactory(),
      [foreground],
      322,
      124,
      { ...DEFAULT_DEPTH_OF_FIELD_SETTINGS, enabled: true },
      new Map([['blob-background', image]])
    )

    expect(gradient.addColorStop).toHaveBeenNthCalledWith(1, 0, 'rgba(0, 0, 0, 0)')
    expect(gradient.addColorStop).toHaveBeenNthCalledWith(2, 1, 'rgba(0, 0, 0, 1)')
  })

  describe('color grading global', () => {
    it('identifie un état neutre ou inactif', async () => {
      const { isColorGradingNeutral } = await import('./useCanvasRenderer')
      expect(isColorGradingNeutral(undefined)).toBe(true)
      expect(
        isColorGradingNeutral({
          enabled: false,
          preset: 'warm',
          exposure: 10,
          contrast: 10,
          saturation: 10,
          temperature: 10,
          tint: 10
        })
      ).toBe(true)
      expect(
        isColorGradingNeutral({
          enabled: true,
          preset: 'neutral',
          exposure: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          tint: 0
        })
      ).toBe(true)
      expect(
        isColorGradingNeutral({
          enabled: true,
          preset: 'warm',
          exposure: 5,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          tint: 0
        })
      ).toBe(false)
    })

    it('génère la chaîne de filtres CSS appropriée', async () => {
      const { buildColorGradingCssFilter } = await import('./useCanvasRenderer')
      const filter = buildColorGradingCssFilter({
        enabled: true,
        preset: 'custom',
        exposure: 20, // 1.200
        contrast: -10, // 0.900
        saturation: 50, // 1.500
        temperature: 0,
        tint: 10 // 18deg
      })

      expect(filter).toContain('brightness(1.200)')
      expect(filter).toContain('contrast(0.900)')
      expect(filter).toContain('saturate(1.500)')
      expect(filter).toContain('hue-rotate(18.0deg)')
    })
  })
})
