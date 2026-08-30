import type { ShaderSettings } from '@core/types/editor.types'

export type ShaderRenderStatus =
  | 'applied'
  | 'neutral'
  | 'unsupported'
  | 'context-lost'
  | 'oversized'
  | 'error'

export function isShaderNeutral(settings?: ShaderSettings): boolean {
  if (!settings || !settings.enabled || settings.preset === 'none') {
    return true
  }

  const { intensity, grain, aberration, scanlines, vignette, bloom } = settings
  if (intensity <= 0) return true
  return grain <= 0 && aberration <= 0 && scanlines <= 0 && vignette <= 0 && bloom <= 0
}

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`

const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform float u_grain;
uniform float u_aberration;
uniform float u_scanlines;
uniform float u_scanlines_density;
uniform float u_vignette;
uniform float u_bloom;

varying vec2 v_texCoord;

// Générateur pseudo-aléatoire pour le grain de film
float random(vec2 st) {
  return fract(sin(dot(st.xy + vec2(u_time * 0.001, u_time * 0.002), vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = v_texCoord;
  vec2 center = vec2(0.5, 0.5);
  vec2 distFromCenter = uv - center;
  float dist = length(distFromCenter);

  // 1. Aberration chromatique (dispersion RVB radiale)
  float shift = u_aberration * u_intensity * 0.02 * dist;
  vec2 dir = dist > 0.0001 ? normalize(distFromCenter) : vec2(0.0);
  
  float r = texture2D(u_image, uv + dir * shift).r;
  float g = texture2D(u_image, uv).g;
  float b = texture2D(u_image, uv - dir * shift).b;
  float a = texture2D(u_image, uv).a;

  vec3 color = vec3(r, g, b);

  // Si le pixel est transparent, préserver le canal alpha
  if (a <= 0.001) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    return;
  }

  // 2. Bloom doux / Diffusion des hautes lumières
  if (u_bloom > 0.0) {
    float bloomFactor = u_bloom * u_intensity * 0.015;
    vec2 off1 = vec2(1.5, 1.5) / u_resolution;
    vec2 off2 = vec2(-1.5, 1.5) / u_resolution;
    vec3 blur = (
      texture2D(u_image, uv + off1).rgb +
      texture2D(u_image, uv - off1).rgb +
      texture2D(u_image, uv + off2).rgb +
      texture2D(u_image, uv - off2).rgb
    ) * 0.25;
    
    // Seuil de haute lumière
    float lum = dot(blur, vec3(0.299, 0.587, 0.114));
    if (lum > 0.5) {
      color += blur * (lum - 0.5) * bloomFactor * 2.0;
    }
  }

  // 3. Scanlines (CRT rétro avec contrôle de densité)
  if (u_scanlines > 0.0) {
    float density = u_scanlines_density > 0.0 ? u_scanlines_density : 1.0;
    float scanline = sin(uv.y * u_resolution.y * 1.570796 * density) * 0.5 + 0.5;
    float scanlineAmount = u_scanlines * u_intensity * 0.08;
    color -= color * scanline * scanlineAmount;
  }

  // 4. Grain de film analogique
  if (u_grain > 0.0) {
    float noise = (random(uv * u_resolution) - 0.5) * 2.0;
    float grainAmount = u_grain * u_intensity * 0.005;
    color += noise * grainAmount;
  }

  // 5. Vignettage optique
  if (u_vignette > 0.0) {
    float vignette = smoothstep(0.8, 0.25, dist * (0.8 + (u_vignette * u_intensity * 0.01)));
    color *= vignette;
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), a);
}
`

interface WebGLShaderPipeline {
  canvas: HTMLCanvasElement
  gl: WebGLRenderingContext
  program: WebGLProgram
  positionBuffer: WebGLBuffer
  texCoordBuffer: WebGLBuffer
  texture: WebGLTexture
  uniforms: {
    resolution: WebGLUniformLocation | null
    time: WebGLUniformLocation | null
    intensity: WebGLUniformLocation | null
    grain: WebGLUniformLocation | null
    aberration: WebGLUniformLocation | null
    scanlines: WebGLUniformLocation | null
    scanlinesDensity: WebGLUniformLocation | null
    vignette: WebGLUniformLocation | null
    bloom: WebGLUniformLocation | null
  }
}

let cachedPipeline: WebGLShaderPipeline | null = null
let initializationFailure: 'unsupported' | 'error' | null = null

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('Erreur compilation shader WebGL:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function initWebGLPipeline(): WebGLShaderPipeline | null {
  if (cachedPipeline) return cachedPipeline
  if (initializationFailure) return null

  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl', {
    alpha: true,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    antialias: false
  })
  if (!gl) {
    console.warn('WebGL non supporté pour les shaders post-processing')
    initializationFailure = 'unsupported'
    return null
  }

  const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
  const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
  if (!vertShader || !fragShader) {
    if (vertShader) gl.deleteShader(vertShader)
    if (fragShader) gl.deleteShader(fragShader)
    initializationFailure = 'error'
    return null
  }

  const program = gl.createProgram()
  if (!program) {
    gl.deleteShader(vertShader)
    gl.deleteShader(fragShader)
    initializationFailure = 'error'
    return null
  }
  gl.attachShader(program, vertShader)
  gl.attachShader(program, fragShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('Erreur link program WebGL:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    gl.deleteShader(vertShader)
    gl.deleteShader(fragShader)
    initializationFailure = 'error'
    return null
  }
  gl.deleteShader(vertShader)
  gl.deleteShader(fragShader)

  // Setup full-screen quad (2 triangles)
  const posBuffer = gl.createBuffer()
  if (!posBuffer) {
    initializationFailure = 'error'
    return null
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW
  )

  const texBuffer = gl.createBuffer()
  if (!texBuffer) {
    initializationFailure = 'error'
    return null
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]),
    gl.STATIC_DRAW
  )

  const texture = gl.createTexture()
  if (!texture) {
    initializationFailure = 'error'
    return null
  }
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  cachedPipeline = {
    canvas,
    gl,
    program,
    positionBuffer: posBuffer,
    texCoordBuffer: texBuffer,
    texture,
    uniforms: {
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      time: gl.getUniformLocation(program, 'u_time'),
      intensity: gl.getUniformLocation(program, 'u_intensity'),
      grain: gl.getUniformLocation(program, 'u_grain'),
      aberration: gl.getUniformLocation(program, 'u_aberration'),
      scanlines: gl.getUniformLocation(program, 'u_scanlines'),
      scanlinesDensity: gl.getUniformLocation(program, 'u_scanlines_density'),
      vignette: gl.getUniformLocation(program, 'u_vignette'),
      bloom: gl.getUniformLocation(program, 'u_bloom')
    }
  }

  return cachedPipeline
}

/**
 * Applique le post-processing shader WebGL à un canvas source et dessine le résultat dans le targetCtx.
 * Retourne un statut explicite. Le contexte cible n'est modifié qu'après un rendu WebGL réussi.
 */
export function applyPostProcessingShader(
  sourceCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  settings?: ShaderSettings,
  time: number = 0
): ShaderRenderStatus {
  if (isShaderNeutral(settings)) {
    return 'neutral'
  }

  const pipeline = initWebGLPipeline()
  if (!pipeline) {
    return initializationFailure ?? 'unsupported'
  }

  const { gl, program, positionBuffer, texCoordBuffer, texture, uniforms, canvas } = pipeline
  const width = sourceCanvas.width
  const height = sourceCanvas.height

  if (gl.isContextLost()) return 'context-lost'

  const maxTextureSize = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE))
  if (width > maxTextureSize || height > maxTextureSize) return 'oversized'

  if (width <= 0 || height <= 0) return 'error'

  try {
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    gl.viewport(0, 0, width, height)
    gl.useProgram(program)

    // Upload texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceCanvas)

    // Position attribute
    const posAttr = gl.getAttribLocation(program, 'a_position')
    if (posAttr < 0) return 'error'
    gl.enableVertexAttribArray(posAttr)
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)

    // TexCoord attribute
    const texAttr = gl.getAttribLocation(program, 'a_texCoord')
    if (texAttr < 0) return 'error'
    gl.enableVertexAttribArray(texAttr)
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
    gl.vertexAttribPointer(texAttr, 2, gl.FLOAT, false, 0, 0)

    // Set uniforms
    const intensity = (settings?.intensity ?? 80) / 100
    gl.uniform2f(uniforms.resolution, width, height)
    gl.uniform1f(uniforms.time, time)
    gl.uniform1f(uniforms.intensity, intensity)
    gl.uniform1f(uniforms.grain, settings?.grain ?? 0)
    gl.uniform1f(uniforms.aberration, settings?.aberration ?? 0)
    gl.uniform1f(uniforms.scanlines, settings?.scanlines ?? 0)
    gl.uniform1f(uniforms.scanlinesDensity, settings?.scanlinesDensity ?? 1.0)
    gl.uniform1f(uniforms.vignette, settings?.vignette ?? 0)
    gl.uniform1f(uniforms.bloom, settings?.bloom ?? 0)

    // Clear and draw the isolated WebGL output, never the destination canvas.
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    if (gl.getError() !== gl.NO_ERROR) return 'error'

    // Transfer back only after the whole GPU pass succeeded.
    targetCtx.clearRect(0, 0, width, height)
    targetCtx.drawImage(canvas, 0, 0, width, height)

    return 'applied'
  } catch (error) {
    console.warn('Erreur lors du rendu shader WebGL:', error)
    return gl.isContextLost() ? 'context-lost' : 'error'
  }
}
