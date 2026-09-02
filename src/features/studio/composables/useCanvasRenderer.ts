import { ref, watchEffect, onScopeDispose, type Ref } from 'vue'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import type { RenderableLayer } from './useHierarchyResolver'
import type { StageSettings } from '@core/types/project.types'
import type { BoxBounds } from '../engine/transform-matrix'
import type {
  CameraFrame,
  ColorGradingSettings,
  DepthOfFieldSettings,
  ShaderSettings
} from '@core/types/editor.types'
import {
  isShaderNeutral,
  applyPostProcessingShader,
  type ShaderRenderStatus
} from '../engine/post-processing-shader.engine'

export const globalImageCache = new Map<string, HTMLImageElement>()
const pendingImageLoads = new Map<string, Promise<HTMLImageElement>>()
const imageCacheOwners = new Map<symbol, Set<string>>()

export interface CanvasImageCacheDiagnostics {
  readyImages: number
  pendingLoads: number
  owners: number
  blobReferences: number
}

export function getCanvasImageCacheDiagnostics(): Readonly<CanvasImageCacheDiagnostics> {
  return Object.freeze({
    readyImages: globalImageCache.size,
    pendingLoads: pendingImageLoads.size,
    owners: imageCacheOwners.size,
    blobReferences: blobCacheService.diagnostics.activeReferences
  })
}

export function clearCanvasImageCache(): void {
  imageCacheOwners.clear()
  for (const image of globalImageCache.values()) {
    image.onload = null
    image.onerror = null
    image.src = ''
  }
  globalImageCache.clear()
}

function isImageOwned(blobId: string): boolean {
  for (const blobIds of imageCacheOwners.values()) {
    if (blobIds.has(blobId)) return true
  }
  return false
}

function evictUnusedImages(): void {
  for (const [blobId, image] of globalImageCache) {
    if (isImageOwned(blobId)) continue
    image.onload = null
    image.onerror = null
    image.src = ''
    globalImageCache.delete(blobId)
  }
}

function syncImageCacheOwner(owner: symbol, blobIds: Iterable<string>): void {
  imageCacheOwners.set(owner, new Set(blobIds))
  evictUnusedImages()
}

function releaseImageCacheOwner(owner: symbol): void {
  imageCacheOwners.delete(owner)
  evictUnusedImages()
}

interface CanvasBuffer {
  width: number
  height: number
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
}

let rawSceneBuffer: CanvasBuffer | null = null
let gradedSceneBuffer: CanvasBuffer | null = null
let shaderFrameBuffer: CanvasBuffer | null = null
let shaderOutputBuffer: CanvasBuffer | null = null
let activeRendererCount = 0

function releaseCanvasBuffer(buffer: CanvasBuffer | null): null {
  if (buffer) {
    buffer.canvas.width = 0
    buffer.canvas.height = 0
  }
  return null
}

export function releaseCanvasRendererBuffers(): void {
  rawSceneBuffer = releaseCanvasBuffer(rawSceneBuffer)
  gradedSceneBuffer = releaseCanvasBuffer(gradedSceneBuffer)
  shaderFrameBuffer = releaseCanvasBuffer(shaderFrameBuffer)
  shaderOutputBuffer = releaseCanvasBuffer(shaderOutputBuffer)
  if (depthOfFieldBuffers) {
    depthOfFieldBuffers.sharpCanvas.width = 0
    depthOfFieldBuffers.sharpCanvas.height = 0
    depthOfFieldBuffers.blurredCanvas.width = 0
    depthOfFieldBuffers.blurredCanvas.height = 0
    depthOfFieldBuffers.maskedCanvas.width = 0
    depthOfFieldBuffers.maskedCanvas.height = 0
    depthOfFieldBuffers = null
  }
}

function releasePostProcessingBuffers(options: { grading: boolean; shader: boolean }): void {
  if (!options.grading) gradedSceneBuffer = releaseCanvasBuffer(gradedSceneBuffer)
  if (!options.shader) {
    shaderFrameBuffer = releaseCanvasBuffer(shaderFrameBuffer)
    shaderOutputBuffer = releaseCanvasBuffer(shaderOutputBuffer)
  }
  if (!options.grading && !options.shader) rawSceneBuffer = releaseCanvasBuffer(rawSceneBuffer)
}

function releaseDepthOfFieldBuffers(): void {
  if (!depthOfFieldBuffers) return
  depthOfFieldBuffers.sharpCanvas.width = 0
  depthOfFieldBuffers.sharpCanvas.height = 0
  depthOfFieldBuffers.blurredCanvas.width = 0
  depthOfFieldBuffers.blurredCanvas.height = 0
  depthOfFieldBuffers.maskedCanvas.width = 0
  depthOfFieldBuffers.maskedCanvas.height = 0
  depthOfFieldBuffers = null
}

function getCanvasBuffer(
  current: CanvasBuffer | null,
  width: number,
  height: number
): CanvasBuffer | null {
  if (typeof document === 'undefined') return null
  if (current && current.width === width && current.height === height) return current

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null

  return { width, height, canvas, context }
}

function ensureRawSceneBuffer(width: number, height: number): CanvasBuffer | null {
  rawSceneBuffer = getCanvasBuffer(rawSceneBuffer, width, height)
  return rawSceneBuffer
}

function ensureGradedSceneBuffer(width: number, height: number): CanvasBuffer | null {
  gradedSceneBuffer = getCanvasBuffer(gradedSceneBuffer, width, height)
  return gradedSceneBuffer
}

function ensureShaderFrameBuffer(width: number, height: number): CanvasBuffer | null {
  shaderFrameBuffer = getCanvasBuffer(shaderFrameBuffer, width, height)
  return shaderFrameBuffer
}

function ensureShaderOutputBuffer(width: number, height: number): CanvasBuffer | null {
  shaderOutputBuffer = getCanvasBuffer(shaderOutputBuffer, width, height)
  return shaderOutputBuffer
}

export function isColorGradingNeutral(settings?: ColorGradingSettings): boolean {
  if (!settings || !settings.enabled) return true
  return (
    settings.exposure === 0 &&
    settings.contrast === 0 &&
    settings.saturation === 0 &&
    settings.temperature === 0 &&
    settings.tint === 0
  )
}

export function buildColorGradingCssFilter(settings: ColorGradingSettings): string {
  const brightness = Math.max(0, 1 + settings.exposure / 100)
  const contrast = Math.max(0, 1 + settings.contrast / 100)
  const saturate = Math.max(0, 1 + settings.saturation / 100)
  const hueRotate = settings.tint * 1.8 // -180deg à +180deg

  const parts: string[] = []
  if (Math.abs(brightness - 1) > 0.001) parts.push(`brightness(${brightness.toFixed(3)})`)
  if (Math.abs(contrast - 1) > 0.001) parts.push(`contrast(${contrast.toFixed(3)})`)
  if (Math.abs(saturate - 1) > 0.001) parts.push(`saturate(${saturate.toFixed(3)})`)
  if (Math.abs(hueRotate) > 0.01) parts.push(`hue-rotate(${hueRotate.toFixed(1)}deg)`)

  return parts.length > 0 ? parts.join(' ') : 'none'
}

interface DepthOfFieldBuffers {
  stageWidth: number
  stageHeight: number
  padding: number
  sharpCanvas: HTMLCanvasElement
  sharpContext: CanvasRenderingContext2D
  blurredCanvas: HTMLCanvasElement
  blurredContext: CanvasRenderingContext2D
  maskedCanvas: HTMLCanvasElement
  maskedContext: CanvasRenderingContext2D
  sceneKey: string | null
  maskKey: string | null
}

let depthOfFieldBuffers: DepthOfFieldBuffers | null = null

type DepthEffectSide = 'far' | 'near'

interface DepthEffectProfile {
  side: DepthEffectSide
  blurRadius: number
}

const OPTICAL_FOCUS_DEPTH = 0.5
const OPTICAL_BLUR_STEPS = 4

export function getCachedAssetImage(blobId: string): HTMLImageElement | undefined {
  const image = globalImageCache.get(blobId)
  return image?.complete && image.naturalWidth > 0 ? image : undefined
}

/**
 * Charge ou récupère depuis le cache mémoire l'image HTML correspondant à un blobId d'asset.
 */
export async function fetchAndLoadImage(
  blobId: string,
  cache: Map<string, HTMLImageElement> = globalImageCache
): Promise<HTMLImageElement> {
  const existing = cache.get(blobId)
  if (existing && existing.complete && existing.naturalWidth > 0) return existing

  if (cache === globalImageCache) {
    const pending = pendingImageLoads.get(blobId)
    if (pending) return pending
  }

  const load = (async () => {
    const url = await blobCacheService.acquire(blobId)
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Impossible de décoder l’asset ${blobId}.`))
        img.src = url
      })
      cache.set(blobId, image)
      return image
    } finally {
      blobCacheService.release(blobId)
    }
  })()

  if (cache !== globalImageCache) return load
  pendingImageLoads.set(blobId, load)
  try {
    return await load
  } finally {
    if (pendingImageLoads.get(blobId) === load) pendingImageLoads.delete(blobId)
  }
}

/**
 * Dessine la liste des calques résolus sur un contexte Canvas 2D.
 */
export function drawLayersOnContext(
  ctx: CanvasRenderingContext2D,
  layers: RenderableLayer[],
  imageCache: Map<string, HTMLImageElement> = globalImageCache
) {
  for (const layer of layers) {
    const img = imageCache.get(layer.asset.blobId)
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save()
      ctx.globalAlpha = layer.opacity

      const hasTransform =
        layer.rotation !== 0 ||
        (layer.scaleX !== undefined && layer.scaleX !== 1) ||
        (layer.scaleY !== undefined && layer.scaleY !== 1)

      if (hasTransform) {
        const scaleOriginX = layer.transformOriginX
        const scaleOriginY = layer.transformOriginY
        const rotationOriginX = layer.rotationOriginX ?? scaleOriginX
        const rotationOriginY = layer.rotationOriginY ?? scaleOriginY
        ctx.translate(rotationOriginX, rotationOriginY)
        if (layer.rotation) {
          ctx.rotate((layer.rotation * Math.PI) / 180)
        }
        ctx.translate(scaleOriginX - rotationOriginX, scaleOriginY - rotationOriginY)
        if (layer.scaleX !== undefined || layer.scaleY !== undefined) {
          ctx.scale(layer.scaleX ?? 1, layer.scaleY ?? 1)
        }

        const localX = layer.x - scaleOriginX
        const localY = layer.y - scaleOriginY

        if (layer.clipPolygon && layer.clipPolygon.length >= 3) {
          ctx.beginPath()
          const [first, ...rest] = layer.clipPolygon
          ctx.moveTo(localX + first.x, localY + first.y)
          for (const pt of rest) {
            ctx.lineTo(localX + pt.x, localY + pt.y)
          }
          ctx.closePath()
          ctx.clip()
        }

        ctx.drawImage(img, localX, localY, layer.width, layer.height)
      } else {
        if (layer.clipPolygon && layer.clipPolygon.length >= 3) {
          ctx.beginPath()
          const [first, ...rest] = layer.clipPolygon
          ctx.moveTo(layer.x + first.x, layer.y + first.y)
          for (const pt of rest) {
            ctx.lineTo(layer.x + pt.x, layer.y + pt.y)
          }
          ctx.closePath()
          ctx.clip()
        }

        ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
      }

      ctx.restore()
    }
  }
}

export function shouldApplyDepthOfField(
  layers: RenderableLayer[],
  settings?: DepthOfFieldSettings
): boolean {
  return Boolean(
    settings?.enabled &&
    settings.blurRadius > 0 &&
    layers.some((layer) => depthEffectProfile(layer, settings) !== null)
  )
}

function resolvedOpticalDepth(layer: RenderableLayer): number {
  // Les distances personnalisées restent lisibles dans les anciens documents,
  // mais seul le rôle optique participe désormais à la profondeur de champ globale.
  if (layer.category === 'foreground' || layer.depthRole === 'subject') {
    return OPTICAL_FOCUS_DEPTH
  }
  return layer.depthRole === 'background' || layer.category === 'background'
    ? 0
    : OPTICAL_FOCUS_DEPTH
}

function depthEffectProfile(
  layer: RenderableLayer,
  settings: DepthOfFieldSettings
): DepthEffectProfile | null {
  const opticalDepth = resolvedOpticalDepth(layer)
  const signedDistance = opticalDepth - OPTICAL_FOCUS_DEPTH
  const normalizedDistance = Math.min(1, Math.abs(signedDistance) / OPTICAL_FOCUS_DEPTH)
  const quantizedDistance = Math.round(normalizedDistance * OPTICAL_BLUR_STEPS) / OPTICAL_BLUR_STEPS
  const blurRadius = settings.blurRadius * quantizedDistance
  if (blurRadius <= 0) return null
  return {
    side: signedDistance < 0 ? 'far' : 'near',
    blurRadius
  }
}

function sameDepthEffect(
  left: DepthEffectProfile | null,
  right: DepthEffectProfile | null
): boolean {
  return left?.side === right?.side && left?.blurRadius === right?.blurRadius
}

function getDepthOfFieldBuffers(
  width: number,
  height: number,
  requiredPadding: number
): DepthOfFieldBuffers | null {
  if (
    depthOfFieldBuffers?.stageWidth === width &&
    depthOfFieldBuffers.stageHeight === height &&
    depthOfFieldBuffers.padding >= requiredPadding
  ) {
    return depthOfFieldBuffers
  }

  const padding = Math.max(96, requiredPadding)
  const sharpCanvas = document.createElement('canvas')
  const blurredCanvas = document.createElement('canvas')
  const maskedCanvas = document.createElement('canvas')
  sharpCanvas.width = width + padding * 2
  sharpCanvas.height = height + padding * 2
  blurredCanvas.width = width + padding * 2
  blurredCanvas.height = height + padding * 2
  maskedCanvas.width = width + padding * 2
  maskedCanvas.height = height + padding * 2
  const sharpContext = sharpCanvas.getContext('2d')
  const blurredContext = blurredCanvas.getContext('2d')
  const maskedContext = maskedCanvas.getContext('2d')
  if (!sharpContext || !blurredContext || !maskedContext) return null

  depthOfFieldBuffers = {
    stageWidth: width,
    stageHeight: height,
    padding,
    sharpCanvas,
    sharpContext,
    blurredCanvas,
    blurredContext,
    maskedCanvas,
    maskedContext,
    sceneKey: null,
    maskKey: null
  }
  return depthOfFieldBuffers
}

function extendCanvasEdges(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  padding: number
) {
  const right = padding + width - 1
  const bottom = padding + height - 1

  ctx.drawImage(canvas, padding, padding, 1, height, 0, padding, padding, height)
  ctx.drawImage(canvas, right, padding, 1, height, padding + width, padding, padding, height)
  ctx.drawImage(canvas, padding, padding, width, 1, padding, 0, width, padding)
  ctx.drawImage(canvas, padding, bottom, width, 1, padding, padding + height, width, padding)
  ctx.drawImage(canvas, padding, padding, 1, 1, 0, 0, padding, padding)
  ctx.drawImage(canvas, right, padding, 1, 1, padding + width, 0, padding, padding)
  ctx.drawImage(canvas, padding, bottom, 1, 1, 0, padding + height, padding, padding)
  ctx.drawImage(canvas, right, bottom, 1, 1, padding + width, padding + height, padding, padding)
}

function depthOfFieldSceneKey(
  layers: RenderableLayer[],
  blurRadius: number,
  imageCache: Map<string, HTMLImageElement>
): string {
  return JSON.stringify({
    blurRadius,
    layers: layers.map((layer) => {
      const image = imageCache.get(layer.asset.blobId)
      return {
        blobId: layer.asset.blobId,
        imageReady: Boolean(image?.complete && image.naturalWidth > 0),
        naturalWidth: image?.naturalWidth ?? 0,
        naturalHeight: image?.naturalHeight ?? 0,
        x: layer.x,
        y: layer.y,
        width: layer.width,
        height: layer.height,
        transformOriginX: layer.transformOriginX,
        transformOriginY: layer.transformOriginY,
        rotationOriginX: layer.rotationOriginX,
        rotationOriginY: layer.rotationOriginY,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        rotation: layer.rotation,
        opacity: layer.opacity
      }
    })
  })
}

function drawDepthLayersOnContext(
  ctx: CanvasRenderingContext2D,
  layers: RenderableLayer[],
  width: number,
  height: number,
  settings: DepthOfFieldSettings,
  profile: DepthEffectProfile,
  imageCache: Map<string, HTMLImageElement>,
  buffers: DepthOfFieldBuffers
): void {
  if (layers.length === 0) return

  const {
    sharpCanvas,
    sharpContext,
    blurredCanvas,
    blurredContext,
    maskedCanvas,
    maskedContext,
    padding
  } = buffers
  const sceneKey = depthOfFieldSceneKey(layers, profile.blurRadius, imageCache)

  if (buffers.sceneKey !== sceneKey) {
    sharpContext.clearRect(0, 0, sharpCanvas.width, sharpCanvas.height)
    blurredContext.clearRect(0, 0, blurredCanvas.width, blurredCanvas.height)

    sharpContext.save()
    sharpContext.translate(padding, padding)
    drawLayersOnContext(sharpContext, layers, imageCache)
    sharpContext.restore()
    extendCanvasEdges(sharpContext, sharpCanvas, width, height, padding)

    blurredContext.save()
    blurredContext.filter = `blur(${profile.blurRadius}px)`
    blurredContext.drawImage(sharpCanvas, 0, 0)
    blurredContext.filter = 'none'
    blurredContext.restore()
    buffers.sceneKey = sceneKey
    buffers.maskKey = null
  }

  const maskKey = `${sceneKey}:${profile.side}:${settings.focusY}:${settings.feather}`
  if (buffers.maskKey !== maskKey) {
    maskedContext.clearRect(0, 0, maskedCanvas.width, maskedCanvas.height)
    maskedContext.save()
    maskedContext.drawImage(blurredCanvas, 0, 0)
    maskedContext.globalCompositeOperation = 'destination-in'
    maskedContext.fillStyle = '#000'

    const splitY = padding + settings.focusY * height
    const feather = settings.feather
    if (feather <= 0) {
      const clampedSplitY = Math.max(0, Math.min(maskedCanvas.height, splitY))
      if (profile.side === 'far') {
        maskedContext.fillRect(0, 0, maskedCanvas.width, clampedSplitY)
      } else {
        maskedContext.fillRect(
          0,
          clampedSplitY,
          maskedCanvas.width,
          maskedCanvas.height - clampedSplitY
        )
      }
    } else {
      const startY = Math.max(0, splitY - feather / 2)
      const endY = Math.min(maskedCanvas.height, splitY + feather / 2)
      const gradient = maskedContext.createLinearGradient(0, startY, 0, endY)
      gradient.addColorStop(0, profile.side === 'far' ? 'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0)')
      gradient.addColorStop(1, profile.side === 'far' ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 1)')
      maskedContext.fillStyle = gradient
      maskedContext.fillRect(0, 0, maskedCanvas.width, maskedCanvas.height)
    }
    maskedContext.restore()
    buffers.maskKey = maskKey
  }

  ctx.drawImage(sharpCanvas, padding, padding, width, height, 0, 0, width, height)
  ctx.drawImage(maskedCanvas, padding, padding, width, height, 0, 0, width, height)
}

function drawRawSceneLayersOnContext(
  ctx: CanvasRenderingContext2D,
  layers: RenderableLayer[],
  width: number,
  height: number,
  settings?: DepthOfFieldSettings,
  imageCache: Map<string, HTMLImageElement> = globalImageCache
): void {
  if (!shouldApplyDepthOfField(layers, settings)) {
    releaseDepthOfFieldBuffers()
    drawLayersOnContext(ctx, layers, imageCache)
    return
  }

  const requiredPadding = Math.ceil(settings!.blurRadius * 3)
  const buffers = getDepthOfFieldBuffers(width, height, requiredPadding)
  if (!buffers || !('filter' in buffers.blurredContext)) {
    drawLayersOnContext(ctx, layers, imageCache)
    return
  }

  let depthRun: RenderableLayer[] = []
  let activeProfile: DepthEffectProfile | null = null
  const flushDepthRun = () => {
    if (!activeProfile || depthRun.length === 0) return
    drawDepthLayersOnContext(
      ctx,
      depthRun,
      width,
      height,
      settings!,
      activeProfile,
      imageCache,
      buffers
    )
    depthRun = []
    activeProfile = null
  }

  for (const layer of layers) {
    const profile = depthEffectProfile(layer, settings!)
    if (!profile) {
      flushDepthRun()
      drawLayersOnContext(ctx, [layer], imageCache)
    } else if (sameDepthEffect(activeProfile, profile)) {
      depthRun.push(layer)
    } else {
      flushDepthRun()
      activeProfile = profile
      depthRun.push(layer)
    }
  }
  flushDepthRun()
}

export interface SceneShaderFrame {
  x: number
  y: number
  width: number
  height: number
}

export interface SceneRenderOptions {
  /** `undefined` conserve la cible, `null` impose la transparence, une couleur peint le matte. */
  backgroundColor?: string | null
  /** Cadre dans lequel les effets spatiaux sont prévisualisés, typiquement le cadrage caméra. */
  shaderFrame?: SceneShaderFrame | null
}

function prepareContextBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor: string | null | undefined
): void {
  if (backgroundColor === undefined) return
  ctx.clearRect(0, 0, width, height)
  if (backgroundColor === null) return
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
}

function applyColorGradingToBuffer(
  source: HTMLCanvasElement,
  target: CanvasBuffer,
  settings: ColorGradingSettings
): void {
  const { context, width, height } = target
  context.clearRect(0, 0, width, height)
  context.save()
  const filter = buildColorGradingCssFilter(settings)
  if (filter !== 'none' && 'filter' in context) context.filter = filter
  context.drawImage(source, 0, 0, width, height)
  context.restore()

  if (settings.temperature === 0) return
  const alpha = Math.min(0.4, (Math.abs(settings.temperature) / 100) * 0.28)
  context.save()
  context.globalCompositeOperation = 'source-atop'
  context.fillStyle =
    settings.temperature > 0
      ? `rgba(255, 160, 40, ${alpha.toFixed(3)})`
      : `rgba(40, 140, 255, ${alpha.toFixed(3)})`
  context.fillRect(0, 0, width, height)
  context.restore()
}

function normalizeShaderFrame(
  frame: SceneShaderFrame,
  width: number,
  height: number
): SceneShaderFrame {
  const x = Math.max(0, Math.min(Math.round(frame.x), width - 1))
  const y = Math.max(0, Math.min(Math.round(frame.y), height - 1))
  return {
    x,
    y,
    width: Math.max(1, Math.min(Math.round(frame.width), width - x)),
    height: Math.max(1, Math.min(Math.round(frame.height), height - y))
  }
}

/**
 * Dessine la scène par plans optiques, compose réellement le grading dans un buffer,
 * puis applique les effets WebGL sur ce résultat. Les aides d’édition restent au caller.
 */
export function drawSceneLayersOnContext(
  ctx: CanvasRenderingContext2D,
  layers: RenderableLayer[],
  width: number,
  height: number,
  depthOfField?: DepthOfFieldSettings,
  imageCache: Map<string, HTMLImageElement> = globalImageCache,
  colorGrading?: ColorGradingSettings,
  shaderSettings?: ShaderSettings,
  options: SceneRenderOptions = {}
): ShaderRenderStatus {
  const hasGrading = !isColorGradingNeutral(colorGrading)
  const hasShader = !isShaderNeutral(shaderSettings)
  releasePostProcessingBuffers({ grading: hasGrading, shader: hasShader })

  if (!hasGrading && !hasShader) {
    prepareContextBackground(ctx, width, height, options.backgroundColor)
    drawRawSceneLayersOnContext(ctx, layers, width, height, depthOfField, imageCache)
    return 'neutral'
  }

  const rawBuffer = ensureRawSceneBuffer(width, height)
  if (!rawBuffer) {
    prepareContextBackground(ctx, width, height, options.backgroundColor)
    drawRawSceneLayersOnContext(ctx, layers, width, height, depthOfField, imageCache)
    return hasShader ? 'unsupported' : 'neutral'
  }

  rawBuffer.context.clearRect(0, 0, width, height)
  prepareContextBackground(rawBuffer.context, width, height, options.backgroundColor ?? null)
  drawRawSceneLayersOnContext(rawBuffer.context, layers, width, height, depthOfField, imageCache)

  let sourceCanvas = rawBuffer.canvas
  if (hasGrading) {
    const gradedBuffer = ensureGradedSceneBuffer(width, height)
    if (gradedBuffer) {
      applyColorGradingToBuffer(rawBuffer.canvas, gradedBuffer, colorGrading!)
      sourceCanvas = gradedBuffer.canvas
    }
  }

  if (!hasShader) {
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(sourceCanvas, 0, 0, width, height)
    return 'neutral'
  }

  if (options.shaderFrame) {
    const frame = normalizeShaderFrame(options.shaderFrame, width, height)
    const frameBuffer = ensureShaderFrameBuffer(frame.width, frame.height)
    const outputBuffer = ensureShaderOutputBuffer(frame.width, frame.height)
    if (!frameBuffer || !outputBuffer) {
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(sourceCanvas, 0, 0, width, height)
      return 'unsupported'
    }

    frameBuffer.context.clearRect(0, 0, frame.width, frame.height)
    frameBuffer.context.drawImage(
      sourceCanvas,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0,
      0,
      frame.width,
      frame.height
    )
    const status = applyPostProcessingShader(
      frameBuffer.canvas,
      outputBuffer.context,
      shaderSettings
    )
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(sourceCanvas, 0, 0, width, height)
    if (status === 'applied') {
      ctx.drawImage(outputBuffer.canvas, frame.x, frame.y, frame.width, frame.height)
    }
    return status
  }

  const outputBuffer = ensureShaderOutputBuffer(width, height)
  if (!outputBuffer) {
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(sourceCanvas, 0, 0, width, height)
    return 'unsupported'
  }

  const status = applyPostProcessingShader(sourceCanvas, outputBuffer.context, shaderSettings)
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(status === 'applied' ? outputBuffer.canvas : sourceCanvas, 0, 0, width, height)
  return status
}

/**
 * Le fond de plateau est un matte d'édition. Pour un format avec canal alpha,
 * il ne doit être exporté que si un véritable calque d'arrière-plan est visible.
 */
export function shouldFillExportBackground(layers: RenderableLayer[], format: string): boolean {
  const normalizedFormat = format.split(';', 1)[0].trim().toLowerCase()
  const supportsTransparency = normalizedFormat === 'image/png' || normalizedFormat === 'image/webp'

  return !supportsTransparency || layers.some((layer) => layer.category === 'background')
}

export interface ExportResolution {
  width: number
  height: number
}

export interface FrameCaptureOptions {
  camera?: CameraFrame
  outputResolution?: ExportResolution
  depthOfField?: DepthOfFieldSettings
  colorGrading?: ColorGradingSettings
  shaderSettings?: ShaderSettings
  onShaderStatus?: (status: ShaderRenderStatus) => void
}

function normalizeCameraCrop(camera: CameraFrame, stage: StageSettings) {
  const x = Math.max(0, Math.min(camera.x, stage.width - 1))
  const y = Math.max(0, Math.min(camera.y, stage.height - 1))
  return {
    x,
    y,
    width: Math.max(1, Math.min(camera.width, stage.width - x)),
    height: Math.max(1, Math.min(camera.height, stage.height - y))
  }
}

/**
 * Capture un instantané PNG/JPEG propre, sans aides d’édition.
 */
async function captureCleanFrameWithRetainedImages(
  layers: RenderableLayer[],
  stage: StageSettings,
  format: string = 'image/png',
  options: FrameCaptureOptions = {}
): Promise<string> {
  const { width, height, backgroundColor } = stage
  const offscreenCanvas = document.createElement('canvas')
  offscreenCanvas.width = width
  offscreenCanvas.height = height

  const ctx = offscreenCanvas.getContext('2d')
  if (!ctx) throw new Error("Impossible d'initialiser le contexte 2D pour la capture.")

  // 1. Précharger tous les assets de la scène
  await Promise.all(layers.map((l) => fetchAndLoadImage(l.asset.blobId, globalImageCache)))

  // 2. Rendre la scène et le grading avant tout recadrage.
  drawSceneLayersOnContext(
    ctx,
    layers,
    width,
    height,
    options.depthOfField,
    globalImageCache,
    options.colorGrading,
    undefined,
    {
      backgroundColor: shouldFillExportBackground(layers, format)
        ? backgroundColor || '#0c0d14'
        : null
    }
  )

  const camera = options.camera?.enabled ? normalizeCameraCrop(options.camera, stage) : null
  const outputResolution = options.outputResolution
  let outputCanvas = offscreenCanvas

  if (camera || outputResolution) {
    outputCanvas = document.createElement('canvas')
    outputCanvas.width = Math.round(outputResolution?.width ?? camera?.width ?? width)
    outputCanvas.height = Math.round(outputResolution?.height ?? camera?.height ?? height)
    const outputContext = outputCanvas.getContext('2d')
    if (!outputContext) throw new Error("Impossible d'initialiser le contexte 2D pour le cadrage.")
    outputContext.imageSmoothingEnabled = true
    outputContext.imageSmoothingQuality = 'high'
    outputContext.drawImage(
      offscreenCanvas,
      camera?.x ?? 0,
      camera?.y ?? 0,
      camera?.width ?? width,
      camera?.height ?? height,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
    )
  }

  // 3. Les effets spatiaux sont calculés dans le repère final après crop et résolution.
  if (!isShaderNeutral(options.shaderSettings)) {
    const shaderCanvas = document.createElement('canvas')
    shaderCanvas.width = outputCanvas.width
    shaderCanvas.height = outputCanvas.height
    const shaderContext = shaderCanvas.getContext('2d')
    if (!shaderContext) throw new Error("Impossible d'initialiser la sortie des shaders.")
    const status = applyPostProcessingShader(outputCanvas, shaderContext, options.shaderSettings)
    options.onShaderStatus?.(status)
    if (status === 'applied') outputCanvas = shaderCanvas
  }

  return outputCanvas.toDataURL(format)
}

export async function captureCleanFrame(
  layers: RenderableLayer[],
  stage: StageSettings,
  format: string = 'image/png',
  options: FrameCaptureOptions = {}
): Promise<string> {
  const cacheOwner = Symbol('canvas-export')
  syncImageCacheOwner(
    cacheOwner,
    layers.map((layer) => layer.asset.blobId)
  )
  try {
    return await captureCleanFrameWithRetainedImages(layers, stage, format, options)
  } finally {
    releaseImageCacheOwner(cacheOwner)
  }
}

export function useCanvasRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  activeLayers: Ref<RenderableLayer[]>,
  stage: Ref<StageSettings>,
  selectedLayerId?: Ref<string | null>,
  selectedBounds?: Ref<BoxBounds | null>,
  targetLabel?: Ref<string | null>,
  isGroupScope?: Ref<boolean>,
  showSelection?: Ref<boolean>,
  depthOfField?: Ref<DepthOfFieldSettings>,
  colorGrading?: Ref<ColorGradingSettings>,
  shaderSettings?: Ref<ShaderSettings>,
  camera?: Ref<CameraFrame>
) {
  const isRendering = ref(false)
  const cacheOwner = Symbol('canvas-renderer')
  const awaitedLoads = new Set<string>()
  let renderFrame: number | null = null
  let disposed = false
  activeRendererCount += 1

  function scheduleRender(): void {
    if (disposed || renderFrame !== null) return
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = null
      render()
    })
  }

  function render() {
    if (disposed) return
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height, backgroundColor } = stage.value

    // Adapter la taille du canvas
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    // 1. Dessiner chaque calque résolu
    const layers = activeLayers.value
    syncImageCacheOwner(
      cacheOwner,
      layers.map((layer) => layer.asset.blobId)
    )

    for (const layer of layers) {
      const blobId = layer.asset.blobId
      const img = globalImageCache.get(blobId)
      if (!img || !img.complete || img.naturalWidth === 0) {
        if (awaitedLoads.has(blobId)) continue
        awaitedLoads.add(blobId)
        void fetchAndLoadImage(blobId, globalImageCache)
          .catch(() => undefined)
          .finally(() => {
            awaitedLoads.delete(blobId)
            scheduleRender()
          })
      }
    }

    isRendering.value = true
    drawSceneLayersOnContext(
      ctx,
      layers,
      width,
      height,
      depthOfField?.value,
      globalImageCache,
      colorGrading?.value,
      shaderSettings?.value,
      {
        backgroundColor: backgroundColor || '#0c0d14',
        shaderFrame: camera?.value.enabled ? camera.value : null
      }
    )
    isRendering.value = false

    // 2. Cadre de sélection interactif avec poignées d'angles et latérales.
    const bounds = showSelection?.value === false ? null : selectedBounds?.value
    if (bounds && bounds.width > 0 && bounds.height > 0) {
      ctx.save()
      const isGroup = isGroupScope?.value ?? false
      const primaryColor = isGroup ? '#6366f1' : '#38bdf8' // Indigo pour groupe, Cyan pour sprite individuel
      const handleSize = 10
      const centerX = bounds.x + bounds.width / 2
      const rotY = bounds.y - 24

      // 1. Tige verticale reliant le haut de la boîte à la poignée de rotation
      ctx.beginPath()
      ctx.strokeStyle = primaryColor
      ctx.lineWidth = 1.5
      ctx.moveTo(centerX, bounds.y)
      ctx.lineTo(centerX, rotY)
      ctx.stroke()

      // 2. Poignée de rotation circulaire déportée
      // Ombre
      ctx.beginPath()
      ctx.arc(centerX, rotY + 1, 7, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
      ctx.fill()

      // Fond blanc
      ctx.beginPath()
      ctx.arc(centerX, rotY, 7, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      // Contour accentué
      ctx.strokeStyle = primaryColor
      ctx.lineWidth = 2
      ctx.stroke()

      // 3. Rectangle délimiteur principal en pointillés
      ctx.strokeStyle = primaryColor
      ctx.lineWidth = 1.5
      ctx.setLineDash([5, 4])
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
      ctx.setLineDash([])

      // 4. Poignées de redimensionnement (4 coins + 4 centres latéraux)
      const halfSize = handleSize / 2
      const handles = [
        { x: bounds.x, y: bounds.y, size: handleSize },
        { x: bounds.x + bounds.width / 2, y: bounds.y, size: handleSize },
        { x: bounds.x + bounds.width, y: bounds.y, size: handleSize },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2, size: handleSize },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height, size: handleSize },
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height, size: handleSize },
        { x: bounds.x, y: bounds.y + bounds.height, size: handleSize },
        { x: bounds.x, y: bounds.y + bounds.height / 2, size: handleSize }
      ]

      for (const handle of handles) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
        ctx.fillRect(handle.x - halfSize + 1, handle.y - halfSize + 1, handle.size, handle.size)

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(handle.x - halfSize, handle.y - halfSize, handle.size, handle.size)

        ctx.strokeStyle = primaryColor
        ctx.lineWidth = 2
        ctx.strokeRect(handle.x - halfSize, handle.y - halfSize, handle.size, handle.size)
      }

      // 5. Étiquette informative au-dessus de la sélection (badge à gauche)
      if (targetLabel?.value) {
        ctx.font = 'bold 11px sans-serif'
        const labelText = targetLabel.value
        const textMetrics = ctx.measureText(labelText)
        const badgeW = textMetrics.width + 14
        const badgeH = 20
        const badgeX = bounds.x
        const badgeY = Math.max(4, bounds.y - badgeH - 4)

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
        ctx.fillRect(badgeX + 1, badgeY + 1, badgeW, badgeH)

        ctx.fillStyle = primaryColor
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(labelText, badgeX + 7, badgeY + 14)
      }

      ctx.restore()
    }
  }

  watchEffect(() => {
    // Dépendances réactives
    void activeLayers.value
    void stage.value
    void selectedLayerId?.value
    void selectedBounds?.value
    void targetLabel?.value
    void isGroupScope?.value
    void showSelection?.value
    void depthOfField?.value
    void colorGrading?.value
    void shaderSettings?.value
    void camera?.value
    syncImageCacheOwner(
      cacheOwner,
      activeLayers.value.map((layer) => layer.asset.blobId)
    )
    scheduleRender()
  })

  onScopeDispose(() => {
    disposed = true
    if (renderFrame !== null) window.cancelAnimationFrame(renderFrame)
    renderFrame = null
    awaitedLoads.clear()
    releaseImageCacheOwner(cacheOwner)
    activeRendererCount = Math.max(0, activeRendererCount - 1)
    if (activeRendererCount === 0) releaseCanvasRendererBuffers()
  })

  return {
    render,
    isRendering
  }
}
