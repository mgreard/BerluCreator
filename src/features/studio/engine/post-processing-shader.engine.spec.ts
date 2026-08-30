import { describe, expect, it, vi } from 'vitest'
import {
  isShaderNeutral,
  applyPostProcessingShader
} from './post-processing-shader.engine'
import { DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'

describe('post-processing-shader.engine', () => {
  it('identifie un état de shader inactif ou neutre', () => {
    expect(isShaderNeutral(undefined)).toBe(true)
    expect(
      isShaderNeutral({
        enabled: false,
        preset: 'crt_retro',
        intensity: 80,
        grain: 1.5,
        aberration: 0.35,
        scanlines: 3,
        scanlinesDensity: 1.5,
        vignette: 3.5,
        bloom: 2.5
      })
    ).toBe(true)
    expect(
      isShaderNeutral({
        enabled: true,
        preset: 'none',
        intensity: 80,
        grain: 0,
        aberration: 0,
        scanlines: 0,
        scanlinesDensity: 1,
        vignette: 0,
        bloom: 0
      })
    ).toBe(true)
    expect(
      isShaderNeutral({
        enabled: true,
        preset: 'film_grain',
        intensity: 0,
        grain: 4.5,
        aberration: 0.15,
        scanlines: 0,
        scanlinesDensity: 1,
        vignette: 3.5,
        bloom: 2.0
      })
    ).toBe(true)
    expect(
      isShaderNeutral({
        enabled: true,
        preset: 'film_grain',
        intensity: 80,
        grain: 4.5,
        aberration: 0.15,
        scanlines: 0,
        scanlinesDensity: 1,
        vignette: 3.5,
        bloom: 2.0
      })
    ).toBe(false)
  })

  it('retourne neutral immédiatement sur le fast path sans appeler WebGL', () => {
    const sourceCanvas = { width: 100, height: 100 } as HTMLCanvasElement
    const targetCtx = { clearRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D

    const result = applyPostProcessingShader(sourceCanvas, targetCtx, {
      enabled: false,
      preset: 'none',
      intensity: 0,
      grain: 0,
      aberration: 0,
      scanlines: 0,
      scanlinesDensity: 1,
      vignette: 0,
      bloom: 0
    })

    expect(result).toBe('neutral')
    expect(targetCtx.drawImage).not.toHaveBeenCalled()
  })
})

interface MockWebGLOptions {
  compile?: boolean
  contextLost?: boolean
  maxTextureSize?: number
}

function createMockWebGL(options: MockWebGLOptions = {}) {
  const compile = options.compile ?? true
  const contextLost = options.contextLost ?? false
  const maxTextureSize = options.maxTextureSize ?? 4096
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    TEXTURE_2D: 7,
    TEXTURE_WRAP_S: 8,
    TEXTURE_WRAP_T: 9,
    CLAMP_TO_EDGE: 10,
    TEXTURE_MIN_FILTER: 11,
    TEXTURE_MAG_FILTER: 12,
    LINEAR: 13,
    MAX_TEXTURE_SIZE: 14,
    TEXTURE0: 15,
    UNPACK_PREMULTIPLY_ALPHA_WEBGL: 16,
    RGBA: 17,
    UNSIGNED_BYTE: 18,
    FLOAT: 19,
    COLOR_BUFFER_BIT: 20,
    TRIANGLES: 21,
    NO_ERROR: 0,
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => compile),
    getShaderInfoLog: vi.fn(() => 'compilation impossible'),
    deleteShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    getUniformLocation: vi.fn(() => ({})),
    isContextLost: vi.fn(() => contextLost),
    getParameter: vi.fn(() => maxTextureSize),
    viewport: vi.fn(),
    useProgram: vi.fn(),
    activeTexture: vi.fn(),
    pixelStorei: vi.fn(),
    texImage2D: vi.fn(),
    getAttribLocation: vi.fn((_program: unknown, name: string) => (name === 'a_position' ? 0 : 1)),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),
    getError: vi.fn(() => 0)
  }
  return gl
}

async function loadEngineWithWebGL(gl: ReturnType<typeof createMockWebGL> | null) {
  vi.restoreAllMocks()
  vi.resetModules()
  const originalCreateElement = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
    if (tagName.toLowerCase() !== 'canvas') return originalCreateElement(tagName)
    return {
      width: 0,
      height: 0,
      getContext: vi.fn((kind: string) => (kind === 'webgl' ? gl : null))
    } as unknown as HTMLCanvasElement
  })
  return import('./post-processing-shader.engine')
}

const activeSettings = {
  ...DEFAULT_SHADER_SETTINGS,
  enabled: true,
  preset: 'vignette' as const,
  vignette: 5
}

describe('post-processing-shader.engine WebGL', () => {
  it('signale explicitement un navigateur sans WebGL', async () => {
    const { applyPostProcessingShader: apply } = await loadEngineWithWebGL(null)
    const target = { clearRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D

    expect(apply({ width: 320, height: 180 } as HTMLCanvasElement, target, activeSettings)).toBe(
      'unsupported'
    )
    expect(target.clearRect).not.toHaveBeenCalled()
  })

  it('applique le rendu et ne transfère le résultat qu’après succès', async () => {
    const gl = createMockWebGL()
    const { applyPostProcessingShader: apply } = await loadEngineWithWebGL(gl)
    const target = { clearRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D
    const source = { width: 320, height: 180 } as HTMLCanvasElement

    expect(apply(source, target, activeSettings)).toBe('applied')
    expect(gl.drawArrays).toHaveBeenCalled()
    expect(target.clearRect).toHaveBeenCalledOnce()
    expect(target.drawImage).toHaveBeenCalledOnce()
  })

  it('signale une compilation impossible sans effacer la destination', async () => {
    const { applyPostProcessingShader: apply } = await loadEngineWithWebGL(
      createMockWebGL({ compile: false })
    )
    const target = { clearRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D

    expect(apply({ width: 320, height: 180 } as HTMLCanvasElement, target, activeSettings)).toBe('error')
    expect(target.clearRect).not.toHaveBeenCalled()
    expect(target.drawImage).not.toHaveBeenCalled()
  })

  it('distingue un contexte perdu et une texture trop grande', async () => {
    let module = await loadEngineWithWebGL(createMockWebGL({ contextLost: true }))
    const target = { clearRect: vi.fn(), drawImage: vi.fn() } as unknown as CanvasRenderingContext2D
    expect(module.applyPostProcessingShader(
      { width: 320, height: 180 } as HTMLCanvasElement,
      target,
      activeSettings
    )).toBe('context-lost')

    vi.restoreAllMocks()
    module = await loadEngineWithWebGL(createMockWebGL({ maxTextureSize: 128 }))
    expect(module.applyPostProcessingShader(
      { width: 320, height: 180 } as HTMLCanvasElement,
      target,
      activeSettings
    )).toBe('oversized')
    expect(target.clearRect).not.toHaveBeenCalled()
  })
})
