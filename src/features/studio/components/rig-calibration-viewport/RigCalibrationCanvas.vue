<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useRigRuntime } from '../../rig-calibration/useRigRuntime'
import { DEFAULT_STAGE_RESOLUTION } from '@core/constants/editor'
import { rigAssetKey } from '../../rig-calibration/rig-catalog.service'
import type {
  AnchoredAssetCalibration,
  Asset,
  CharacterPropSlot,
  NormalizedPoint
} from '@core/types/asset.types'
import type { RigCalibrationTool } from '../../rig-calibration/rig-catalog.types'
import { useRigViewportNavigation } from './useRigViewportNavigation'
import RigCalibrationGizmoNeck from './RigCalibrationGizmoNeck.vue'
import RigCalibrationGizmoHead from './RigCalibrationGizmoHead.vue'
import RigCalibrationGizmoAccessory from './RigCalibrationGizmoAccessory.vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
  drawLayersOnContext,
  fetchAndLoadImage,
  globalImageCache
} from '../../composables/useCanvasRenderer'
import type { RenderableLayer } from '../../composables/useHierarchyResolver'

const rigCatalog = useRigCatalogStore()
const assetStore = useAssetStore()
const projectStore = useProjectStore()
const rigRuntime = useRigRuntime()
const containerRef = useTemplateRef<HTMLDivElement>('containerRef')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef')

const {
  zoom,
  zoomPercentage,
  panX,
  panY,
  isPanning,
  zoomIn,
  zoomOut,
  resetView,
  fitBoundingBoxToViewport,
  startPan,
  updatePan,
  endPan,
  handleWheel
} = useRigViewportNavigation()

// Visual aids
const showGuides = ref(true)
const showGizmos = ref(true)
const showSprites = ref(true)

// Stage / Layout dimensions matching project resolution
const stageWidth = computed(() => projectStore.currentProject?.stage?.width ?? DEFAULT_STAGE_RESOLUTION.width)
const stageHeight = computed(() => projectStore.currentProject?.stage?.height ?? DEFAULT_STAGE_RESOLUTION.height)

// Active selections
const selectedRig = computed(() => rigCatalog.rigById(rigCatalog.selectedRigId))
const selectedSeries = computed(() => {
  const targetId = rigCatalog.calibrationTargetId
  const targetAsset = targetId ? assetStore.assets.find((a) => a.id === targetId) : undefined
  if (targetAsset?.headSeriesId) {
    const series = rigCatalog.seriesById(targetAsset.headSeriesId)
    if (series) return series
  }
  return rigCatalog.seriesById(rigCatalog.selectedHeadSeriesId)
})
const selectedRigSeriesConfig = computed(() => {
  const seriesId = selectedSeries.value?.id ?? rigCatalog.selectedHeadSeriesId
  return selectedRig.value?.headSeries.find((entry) => entry.seriesId === seriesId)
})

type SeriesAnchor = 'neckPivot' | 'mouthAnchor' | CharacterPropSlot

interface CalibrationGesture {
  tool: RigCalibrationTool
  rigId: string
  seriesId?: string
  assetId?: string
}

const activeGesture = ref<CalibrationGesture | null>(null)
const draftNeckAnchor = ref<{ x: number; y: number } | null>(null)
const draftHeadScale = ref<number | null>(null)
const draftHeadRotation = ref<number | null>(null)
const draftSeriesAnchors = ref<Partial<Record<SeriesAnchor, NormalizedPoint>>>({})
const draftAccessoryCalibration = ref<AnchoredAssetCalibration | null>(null)

const effectiveSeries = computed(() => {
  const series = selectedSeries.value
  if (!series) return undefined
  const usesDraft = activeGesture.value?.seriesId === series.id
  return {
    ...series,
    neckPivot: usesDraft
      ? draftSeriesAnchors.value.neckPivot ?? series.neckPivot
      : series.neckPivot,
    mouthAnchor: usesDraft
      ? draftSeriesAnchors.value.mouthAnchor ?? series.mouthAnchor
      : series.mouthAnchor,
    propAnchors: {
      ...series.propAnchors,
      ...(usesDraft && draftSeriesAnchors.value.sunglass
        ? { sunglass: draftSeriesAnchors.value.sunglass }
        : {}),
      ...(usesDraft && draftSeriesAnchors.value.hat
        ? { hat: draftSeriesAnchors.value.hat }
        : {})
    }
  }
})

// Active Body Asset
const bodyAsset = computed<Asset | undefined>(() => {
  if (!selectedRig.value) return undefined
  return rigCatalog.resolveBodyAsset(selectedRig.value, assetStore.assets)
})

// Body Dimensions & Position on Stage Layout (Centered with natural margins)
const bodyWidth = computed(() => bodyAsset.value?.width ?? 334)
const bodyHeight = computed(() => bodyAsset.value?.height ?? 576)

// Calibration Virtual Stage Dimensions:
// Sufficiently sized to contain tall or high-res bodies and full heads without any canvas clipping
const calibStageWidth = computed(() => Math.max(stageWidth.value, bodyWidth.value + 1600, 2400))
const calibStageHeight = computed(() => Math.max(stageHeight.value, bodyHeight.value + 1800, 2800))

const bodyX = computed(() => Math.round((calibStageWidth.value - bodyWidth.value) / 2))
const bodyY = computed(() => Math.round((calibStageHeight.value - bodyHeight.value) / 2 + 250))

// Active Head Asset (targeted or default)
const headAsset = computed<Asset | undefined>(() => {
  const targetId = rigCatalog.calibrationTargetId
  if (targetId) {
    const asset = assetStore.assets.find((a) => a.id === targetId && a.category === 'head')
    if (asset && (!selectedSeries.value || asset.headSeriesId === selectedSeries.value.id)) {
      return asset
    }
  }
  const series = selectedSeries.value
  if (!series) return undefined
  const seriesHeads = assetStore.assets.filter(
    (a) => a.category === 'head' && a.headSeriesId === series.id
  )
  const configuredKey = selectedRigSeriesConfig.value?.defaultHeadAssetKey
  if (configuredKey) {
    const match = seriesHeads.find((a) => rigAssetKey(a) === configuredKey)
    if (match) return match
  }
  return seriesHeads[0]
})

// Active Mouth Asset
const defaultMouthAsset = computed<Asset | undefined>(() => {
  const series = selectedSeries.value
  if (!series?.defaultMouthAssetKey) return undefined
  return assetStore.assets.find(
    (a) => a.category === 'mouth' && rigAssetKey(a) === series.defaultMouthAssetKey
  )
})

const mouthAsset = computed<Asset | undefined>(() => {
  if (assetStore.selectedAsset?.category === 'mouth') {
    return assetStore.selectedAsset
  }
  return defaultMouthAsset.value
})

// Active Anchored Asset (either accessory or mouth)
const activeAnchoredAsset = computed<Asset | undefined>(() => {
  const selected = assetStore.selectedAsset
  if (
    selected &&
    (selected.category === 'props_character' || selected.category === 'mouth')
  ) {
    return selected
  }
  return undefined
})

// Active Accessory Asset (for backwards compatibility)
const activeAccessoryAsset = computed<Asset | undefined>(() => {
  if (assetStore.selectedAsset?.category === 'props_character') {
    return assetStore.selectedAsset
  }
  return undefined
})

// Neck Anchor Position (Local on body vs Global on Stage)
const localNeckPoint = computed(() => {
  const activeDraft = activeGesture.value?.rigId === selectedRig.value?.id
  return (activeDraft ? draftNeckAnchor.value : null) ?? selectedRig.value?.neckAnchor ?? {
    x: Math.round(bodyWidth.value / 2),
    y: Math.round(bodyHeight.value * 0.15)
  }
})

const stageNeckPoint = computed(() => {
  return {
    x: bodyX.value + localNeckPoint.value.x,
    y: bodyY.value + localNeckPoint.value.y
  }
})

// Head Dimensions & Transform
const headDimensions = computed(() => {
  return {
    width: headAsset.value?.width ?? selectedSeries.value?.width ?? 1205,
    height: headAsset.value?.height ?? selectedSeries.value?.height ?? 1305
  }
})

const headScale = computed(
  () =>
    (activeGesture.value?.seriesId === selectedSeries.value?.id
      ? draftHeadScale.value
      : null) ??
    selectedRigSeriesConfig.value?.defaultScale ??
    0.22
)
const headRotation = computed(
  () =>
    (activeGesture.value?.seriesId === selectedSeries.value?.id
      ? draftHeadRotation.value
      : null) ??
    selectedRigSeriesConfig.value?.defaultRotation ??
    0
)

// Head Top-Left position (calibrated so head center lands exactly on neckPoint)
const headLocalTopLeft = computed(() => {
  return {
    x: localNeckPoint.value.x - 0.5 * headDimensions.value.width,
    y: localNeckPoint.value.y - 0.5 * headDimensions.value.height
  }
})

const headStageTopLeft = computed(() => {
  return {
    x: bodyX.value + headLocalTopLeft.value.x,
    y: bodyY.value + headLocalTopLeft.value.y
  }
})

const headRotationOrigin = computed(() => ({
  x: stageNeckPoint.value.x,
  y: stageNeckPoint.value.y
}))

const headVisualTopLeft = computed(() => ({
  x: stageNeckPoint.value.x - headDimensions.value.width / 2,
  y: stageNeckPoint.value.y - headDimensions.value.height / 2
}))

// Character Framing Bounding Box (Entire body + ample headroom for head & accessories)
const characterFramingBounds = computed(() => {
  const bX = bodyX.value
  const bY = bodyY.value
  const bW = bodyWidth.value
  const bH = bodyHeight.value

  const neckX = stageNeckPoint.value.x
  const neckY = stageNeckPoint.value.y

  // Projected head dimensions
  const hW = headDimensions.value.width * headScale.value
  const hH = headDimensions.value.height * headScale.value

  // Generous safety headroom above the neck for head, hats and rotation handle
  const topHeadroom = Math.max(hH * 0.75 + 80, 240)

  const left = Math.min(bX, neckX - hW / 2 - 40)
  const right = Math.max(bX + bW, neckX + hW / 2 + 40)
  const top = Math.min(bY, neckY - topHeadroom)
  const bottom = bY + bH + 40

  return {
    x: left,
    y: top,
    width: Math.max(100, right - left),
    height: Math.max(100, bottom - top)
  }
})

// Anchored Element Placement & Calibration (Accessories & Mouth)
const activeAnchoredSlot = computed<'mouth' | CharacterPropSlot>(() => {
  if (activeAnchoredAsset.value?.category === 'mouth') return 'mouth'
  return activeAnchoredAsset.value?.characterPropSlot ?? 'sunglass'
})

const activeAnchorNormalized = computed<NormalizedPoint>(() => {
  if (!effectiveSeries.value) return { x: 0.5, y: 0.5 }
  if (activeAnchoredSlot.value === 'mouth') {
    return effectiveSeries.value.mouthAnchor ?? { x: 0.5, y: 0.66 }
  }
  return (
    effectiveSeries.value.propAnchors[activeAnchoredSlot.value] ?? {
      x: 0.5,
      y: activeAnchoredSlot.value === 'hat' ? 0.08 : 0.43
    }
  )
})

const activeAnchoredCalibration = computed<AnchoredAssetCalibration | null>(() => {
  const series = effectiveSeries.value
  const asset = activeAnchoredAsset.value
  if (!series || !asset) return null
  const activeDraft =
    activeGesture.value?.assetId === asset.id && activeGesture.value.seriesId === series.id
  return (
    (activeDraft ? draftAccessoryCalibration.value : null) ??
    asset.anchoredCalibrationBySeries?.[series.id] ?? {
      pivot: { x: 0.5, y: 0.5 },
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      rotation: 0
    }
  )
})

function transformPointAround(
  point: { x: number; y: number },
  scaleOrigin: { x: number; y: number },
  scaleX: number,
  scaleY: number,
  rotation: number,
  rotationOrigin = scaleOrigin
): { x: number; y: number } {
  const radians = (rotation * Math.PI) / 180
  const scaledX = scaleOrigin.x + (point.x - scaleOrigin.x) * scaleX
  const scaledY = scaleOrigin.y + (point.y - scaleOrigin.y) * scaleY
  const dx = scaledX - rotationOrigin.x
  const dy = scaledY - rotationOrigin.y
  return {
    x: rotationOrigin.x + dx * Math.cos(radians) - dy * Math.sin(radians),
    y: rotationOrigin.y + dx * Math.sin(radians) + dy * Math.cos(radians)
  }
}

function computeStageAnchoredPivot(
  anchor: NormalizedPoint,
  calibration: AnchoredAssetCalibration
): { x: number; y: number } {
  const anchorPoint = transformPointAround(
    {
      x: headStageTopLeft.value.x + anchor.x * headDimensions.value.width,
      y: headStageTopLeft.value.y + anchor.y * headDimensions.value.height
    },
    stageNeckPoint.value,
    headScale.value,
    headScale.value,
    headRotation.value,
    headRotationOrigin.value
  )
  const radians = (headRotation.value * Math.PI) / 180
  const offsetX = calibration.offsetX * headScale.value
  const offsetY = calibration.offsetY * headScale.value
  return {
    x: anchorPoint.x + offsetX * Math.cos(radians) - offsetY * Math.sin(radians),
    y: anchorPoint.y + offsetX * Math.sin(radians) + offsetY * Math.cos(radians)
  }
}

const activeAnchoredPivotStage = computed(() => {
  const series = effectiveSeries.value
  const asset = activeAnchoredAsset.value
  const calibration = activeAnchoredCalibration.value
  if (!series || !asset || !calibration) return null
  return computeStageAnchoredPivot(activeAnchorNormalized.value, calibration)
})

// Compute layers for exact Canvas 2D rendering matching Studio
const renderableLayers = computed<RenderableLayer[]>(() => {
  const layers: RenderableLayer[] = []

  // 1. Body Layer
  if (bodyAsset.value) {
    layers.push({
      id: 'calibration-body',
      layerId: 'calibration-body',
      name: bodyAsset.value.name,
      category: 'body',
      groupId: 'calibration-rig',
      groupName: selectedRig.value?.name ?? 'Rig',
      groupKind: 'character',
      stagePlane: 'rear',
      groupZIndex: 10,
      layerZIndex: 10,
      sceneZIndex: 10,
      order: 0,
      asset: bodyAsset.value,
      zIndex: 10,
      muted: false,
      locked: false,
      isMovable: true,
      depthRole: 'subject',
      opticalDepth: 0.5,
      x: bodyX.value,
      y: bodyY.value,
      width: bodyWidth.value,
      height: bodyHeight.value,
      transformOriginX: bodyX.value + bodyWidth.value / 2,
      transformOriginY: bodyY.value + bodyHeight.value / 2,
      scaleX: 1,
      scaleY: 1,
      localX: 0,
      localY: 0,
      localScaleX: 1,
      localScaleY: 1,
      localRotation: 0,
      rotation: 0,
      opacity: 1
    })
  }

  // 2. Head Layer
  if (headAsset.value && effectiveSeries.value) {
    const headW = headAsset.value.width
    const headH = headAsset.value.height
    const headX = headStageTopLeft.value.x
    const headY = headStageTopLeft.value.y

    const headLayer: RenderableLayer = {
      id: 'calibration-head',
      layerId: 'calibration-head',
      name: headAsset.value.name,
      category: 'head',
      groupId: 'calibration-rig',
      groupName: selectedRig.value?.name ?? 'Rig',
      groupKind: 'character',
      stagePlane: 'rear',
      groupZIndex: 10,
      layerZIndex: 20,
      sceneZIndex: 10,
      order: 1,
      asset: headAsset.value,
      zIndex: 20,
      muted: false,
      locked: false,
      isMovable: true,
      depthRole: 'subject',
      opticalDepth: 0.5,
      x: Math.round(headX),
      y: Math.round(headY),
      width: headW,
      height: headH,
      transformOriginX: stageNeckPoint.value.x,
      transformOriginY: stageNeckPoint.value.y,
      rotationOriginX: headRotationOrigin.value.x,
      rotationOriginY: headRotationOrigin.value.y,
      scaleX: headScale.value,
      scaleY: headScale.value,
      localX: headLocalTopLeft.value.x,
      localY: headLocalTopLeft.value.y,
      localScaleX: headScale.value,
      localScaleY: headScale.value,
      localRotation: headRotation.value,
      rotation: headRotation.value,
      opacity: 1
    }
    layers.push(headLayer)

    function resolveAnchoredLayerTransform(
      asset: Asset,
      anchor: NormalizedPoint,
      calibration: AnchoredAssetCalibration
    ) {
      const anchorPoint = transformPointAround(
        {
          x: headLayer.x + anchor.x * headDimensions.value.width,
          y: headLayer.y + anchor.y * headDimensions.value.height
        },
        { x: headLayer.transformOriginX, y: headLayer.transformOriginY },
        headLayer.scaleX,
        headLayer.scaleY,
        headLayer.rotation,
        {
          x: headLayer.rotationOriginX ?? headLayer.transformOriginX,
          y: headLayer.rotationOriginY ?? headLayer.transformOriginY
        }
      )
      const radians = (headLayer.rotation * Math.PI) / 180
      const offsetX = calibration.offsetX * headLayer.scaleX
      const offsetY = calibration.offsetY * headLayer.scaleY
      const centerX = anchorPoint.x + offsetX * Math.cos(radians) - offsetY * Math.sin(radians)
      const centerY = anchorPoint.y + offsetX * Math.sin(radians) + offsetY * Math.cos(radians)
      const w = asset.width
      const h = asset.height
      return {
        x: Math.round(centerX - w * 0.5),
        y: Math.round(centerY - h * 0.5),
        width: w,
        height: h,
        transformOriginX: centerX,
        transformOriginY: centerY,
        scaleX: headLayer.scaleX * calibration.scale,
        scaleY: headLayer.scaleY * calibration.scale,
        localX: anchor.x * headDimensions.value.width + calibration.offsetX - w * 0.5,
        localY: anchor.y * headDimensions.value.height + calibration.offsetY - h * 0.5,
        localScaleX: calibration.scale,
        localScaleY: calibration.scale,
        localRotation: calibration.rotation,
        rotation: headLayer.rotation + calibration.rotation
      }
    }

    // 3. Mouth Layer
    if (mouthAsset.value) {
      const mAsset = mouthAsset.value
      const anchor = effectiveSeries.value.mouthAnchor
      const isDraft = activeGesture.value?.assetId === mAsset.id
      const calib =
        (isDraft ? draftAccessoryCalibration.value : null) ??
        mAsset.anchoredCalibrationBySeries?.[effectiveSeries.value.id] ?? {
          pivot: { x: 0.5, y: 0.5 },
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0
        }
      const transform = resolveAnchoredLayerTransform(mAsset, anchor, calib)

      layers.push({
        id: 'calibration-mouth',
        layerId: 'calibration-mouth',
        name: mAsset.name,
        category: 'mouth',
        groupId: 'calibration-rig',
        groupName: selectedRig.value?.name ?? 'Rig',
        groupKind: 'character',
        stagePlane: 'rear',
        groupZIndex: 10,
        layerZIndex: 22,
        sceneZIndex: 10,
        order: 2,
        asset: mAsset,
        zIndex: 22,
        muted: false,
        locked: false,
        isMovable: false,
        depthRole: 'subject',
        opticalDepth: 0.5,
        ...transform,
        opacity: 1
      })
    }

    // 4. Accessory Layer
    if (activeAccessoryAsset.value) {
      const accAsset = activeAccessoryAsset.value
      const slot = accAsset.characterPropSlot ?? 'sunglass'
      const anchor = effectiveSeries.value.propAnchors[slot] ?? {
        x: 0.5,
        y: slot === 'hat' ? 0.08 : 0.43
      }
      const isDraft = activeGesture.value?.assetId === accAsset.id
      const calib =
        (isDraft ? draftAccessoryCalibration.value : null) ??
        accAsset.anchoredCalibrationBySeries?.[effectiveSeries.value.id] ?? {
          pivot: { x: 0.5, y: 0.5 },
          offsetX: 0,
          offsetY: 0,
          scale: 1,
          rotation: 0
        }
      const transform = resolveAnchoredLayerTransform(accAsset, anchor, calib)

      layers.push({
        id: 'calibration-accessory',
        layerId: 'calibration-accessory',
        name: accAsset.name,
        category: 'props_character',
        groupId: 'calibration-rig',
        groupName: selectedRig.value?.name ?? 'Rig',
        groupKind: 'character',
        stagePlane: 'rear',
        groupZIndex: 10,
        layerZIndex: 25,
        sceneZIndex: 10,
        order: 3,
        asset: accAsset,
        zIndex: 25,
        muted: false,
        locked: false,
        isMovable: false,
        depthRole: 'subject',
        opticalDepth: 0.5,
        ...transform,
        opacity: 1
      })
    }
  }

  return layers
})

// Draw to Canvas 2D
let renderFrame: number | null = null
let renderGeneration = 0

async function renderCanvas(generation: number): Promise<void> {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const layers = renderableLayers.value

  const missingBlobIds = [
    ...new Set(
      layers
        .map((layer) => layer.asset.blobId)
        .filter((blobId) => {
          const image = globalImageCache.get(blobId)
          return !image?.complete || image.naturalWidth <= 0
        })
    )
  ]
  const loadPromises = missingBlobIds.map((blobId) =>
    fetchAndLoadImage(blobId, globalImageCache)
  )
  await Promise.allSettled(loadPromises)
  if (generation !== renderGeneration || canvas !== canvasRef.value) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawLayersOnContext(ctx, layers, globalImageCache)
}

function scheduleRender(): void {
  renderGeneration += 1
  if (renderFrame !== null) return
  renderFrame = requestAnimationFrame(() => {
    renderFrame = null
    void renderCanvas(renderGeneration)
  })
}

watch(
  [renderableLayers, calibStageWidth, calibStageHeight],
  scheduleRender,
  { deep: false }
)

// Update Handlers
function clearGestureDrafts(): void {
  draftNeckAnchor.value = null
  draftHeadScale.value = null
  draftHeadRotation.value = null
  draftSeriesAnchors.value = {}
  draftAccessoryCalibration.value = null
}

function beginCalibrationGesture(tool: RigCalibrationTool): void {
  if (activeGesture.value) return
  const rig = selectedRig.value
  if (!rig) return
  clearGestureDrafts()
  activeGesture.value = {
    tool,
    rigId: rig.id,
    seriesId: selectedSeries.value?.id,
    assetId: tool === 'accessory' ? activeAnchoredAsset.value?.id : undefined
  }

  if (tool === 'body' || tool === 'head') {
    draftNeckAnchor.value = { ...rig.neckAnchor }
  }
  if (tool === 'head') {
    draftHeadScale.value = selectedRigSeriesConfig.value?.defaultScale ?? 0.22
    draftHeadRotation.value = selectedRigSeriesConfig.value?.defaultRotation ?? 0
  }
  if (tool === 'accessory' && activeAnchoredCalibration.value) {
    draftAccessoryCalibration.value = {
      ...activeAnchoredCalibration.value,
      pivot: { ...activeAnchoredCalibration.value.pivot }
    }
  }
}

async function commitCalibrationGesture(): Promise<void> {
  const gesture = activeGesture.value
  if (!gesture) return
  activeGesture.value = null

  const neckAnchor = draftNeckAnchor.value ? { ...draftNeckAnchor.value } : undefined
  const scale = draftHeadScale.value ?? undefined
  const rotation = draftHeadRotation.value ?? undefined
  const anchorEntry = Object.entries(draftSeriesAnchors.value)[0] as
    | [SeriesAnchor, NormalizedPoint]
    | undefined
  const accessory = draftAccessoryCalibration.value
    ? {
        ...draftAccessoryCalibration.value,
        pivot: { ...draftAccessoryCalibration.value.pivot }
      }
    : null
  clearGestureDrafts()

  try {
    if (gesture.tool === 'accessory' && gesture.assetId && gesture.seriesId && accessory) {
      const asset = assetStore.assets.find((candidate) => candidate.id === gesture.assetId)
      if (!asset) return
      await assetStore.updateAsset(asset.id, {
        anchoredCalibrationBySeries: {
          ...asset.anchoredCalibrationBySeries,
          [gesture.seriesId]: accessory
        }
      })
      rigRuntime.syncRigLayers(gesture.rigId)
    } else {
      rigCatalog.commitRigCalibration(gesture.rigId, {
        ...(neckAnchor ? { neckAnchor } : {}),
        ...(gesture.seriesId ? { seriesId: gesture.seriesId } : {}),
        ...(scale !== undefined ? { defaultScale: Number(scale.toFixed(4)) } : {}),
        ...(rotation !== undefined ? { defaultRotation: Math.round(rotation) } : {}),
        ...(anchorEntry
          ? { anchor: { id: anchorEntry[0], point: anchorEntry[1] } }
          : {})
      })
      rigRuntime.syncRigLayers(gesture.rigId)
    }
  } catch (error) {
    console.error('Impossible d’enregistrer le geste de calibration :', error)
  }
}

function ensureCalibrationGesture(tool: RigCalibrationTool): void {
  if (!activeGesture.value) beginCalibrationGesture(tool)
}

function onUpdateNeckPoint(localPoint: { x: number; y: number }): void {
  if (!selectedRig.value) return
  ensureCalibrationGesture('body')
  draftNeckAnchor.value = { x: Math.round(localPoint.x), y: Math.round(localPoint.y) }
}

function onUpdateHeadTransform(patch: { x?: number; y?: number; scale?: number; rotation?: number }): void {
  const rig = selectedRig.value
  const series = effectiveSeries.value
  if (!rig || !series) return
  ensureCalibrationGesture('head')

  if (patch.x !== undefined || patch.y !== undefined) {
    // Convert stage head top-left to body local coordinates
    const localHeadX = patch.x !== undefined ? patch.x - bodyX.value : headLocalTopLeft.value.x
    const localHeadY = patch.y !== undefined ? patch.y - bodyY.value : headLocalTopLeft.value.y
    const newNeckX = Math.round(localHeadX + 0.5 * headDimensions.value.width)
    const newNeckY = Math.round(localHeadY + 0.5 * headDimensions.value.height)

    draftNeckAnchor.value = { x: newNeckX, y: newNeckY }
  }

  if (patch.scale !== undefined) draftHeadScale.value = Number(patch.scale.toFixed(4))
  if (patch.rotation !== undefined) draftHeadRotation.value = Math.round(patch.rotation)
}

function onUpdateAccessoryCalibration(
  patch: Partial<NonNullable<typeof activeAnchoredCalibration.value>>
): void {
  const series = selectedSeries.value
  const asset = activeAnchoredAsset.value
  const current = activeAnchoredCalibration.value
  if (!series || !asset || !current) return
  ensureCalibrationGesture('accessory')

  draftAccessoryCalibration.value = {
    ...current,
    ...patch,
    pivot: patch.pivot ? { ...patch.pivot } : { ...current.pivot }
  }
}

watch(
  () => [
    rigCatalog.selectedRigId,
    rigCatalog.selectedHeadSeriesId,
    rigCatalog.calibrationTargetId,
    rigCatalog.calibrationTool,
    assetStore.selectedAssetId
  ],
  () => {
    if (activeGesture.value) void commitCalibrationGesture()
  }
)

watch(showGizmos, (visible) => {
  if (!visible && activeGesture.value) void commitCalibrationGesture()
})

watch(
  () => [selectedRig.value?.id, bodyAsset.value?.id],
  () => {
    scheduleAutoFit()
  }
)

function handleAutoFit(): void {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  fitBoundingBoxToViewport(
    rect.width,
    rect.height,
    calibStageWidth.value,
    calibStageHeight.value,
    characterFramingBounds.value,
    { top: 72, bottom: 40, left: 56, right: 56 }
  )
}

let containerResizeObserver: ResizeObserver | null = null
let autoFitFrame: number | null = null

function scheduleAutoFit(): void {
  if (autoFitFrame !== null) cancelAnimationFrame(autoFitFrame)
  autoFitFrame = requestAnimationFrame(() => {
    autoFitFrame = null
    handleAutoFit()
  })
}

onMounted(() => {
  scheduleRender()
  scheduleAutoFit()
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    containerResizeObserver = new ResizeObserver(scheduleAutoFit)
    containerResizeObserver.observe(containerRef.value)
  } else {
    window.addEventListener('resize', scheduleAutoFit)
  }
})

onUnmounted(() => {
  if (activeGesture.value) void commitCalibrationGesture()
  renderGeneration += 1
  if (renderFrame !== null) cancelAnimationFrame(renderFrame)
  renderFrame = null
  if (canvasRef.value) {
    canvasRef.value.width = 0
    canvasRef.value.height = 0
  }
  containerResizeObserver?.disconnect()
  containerResizeObserver = null
  window.removeEventListener('resize', scheduleAutoFit)
  if (autoFitFrame !== null) cancelAnimationFrame(autoFitFrame)
  autoFitFrame = null
})

function onContainerPointerDown(e: PointerEvent): void {
  const eventTarget = e.target
  const isPanSurface = eventTarget === containerRef.value
    || (eventTarget instanceof HTMLElement && eventTarget.dataset.viewportPanSurface === 'true')
  if (e.button !== 0 || !isPanSurface) return

  e.preventDefault()
  startPan(e.clientX, e.clientY)
  const target = e.currentTarget as HTMLElement
  if (target?.setPointerCapture) target.setPointerCapture(e.pointerId)
}

function onContainerPointerMove(e: PointerEvent): void {
  updatePan(e.clientX, e.clientY)
}

function onContainerPointerUp(e: PointerEvent): void {
  endPan()
  const target = e.currentTarget as HTMLElement
  if (target?.releasePointerCapture) {
    try {
      target.releasePointerCapture(e.pointerId)
    } catch {
      // Ignored
    }
  }
}

function onWheel(e: WheelEvent): void {
  if (!containerRef.value) return
  handleWheel(e, containerRef.value.getBoundingClientRect())
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative h-full min-h-0 w-full min-w-0 select-none overflow-hidden bg-bg-base/95"
    tabindex="0"
    @pointerdown="onContainerPointerDown"
    @pointermove="onContainerPointerMove"
    @pointerup="onContainerPointerUp"
    @pointercancel="onContainerPointerUp"
    @wheel="onWheel"
  >
    <!-- Viewport Top Toolbar with Zoom & Layer Controls -->
    <div class="absolute right-4 top-4 z-50 flex items-center gap-1.5 rounded-xl border border-border-default bg-bg-surface/90 p-1.5 shadow-xl backdrop-blur-md">
      <!-- Zoom Out -->
      <Button
        size="xs"
        variant="ghost"
        class="h-7 w-7 p-0 text-text-secondary hover:text-text-primary"
        title="Zoom arrière"
        @click="zoomOut()"
      >
        <span class="text-sm font-bold">−</span>
      </Button>

      <!-- Zoom Indicator -->
      <span class="min-w-[42px] text-center text-xs font-mono font-medium text-text-primary">
        {{ zoomPercentage }}%
      </span>

      <!-- Zoom In -->
      <Button
        size="xs"
        variant="ghost"
        class="h-7 w-7 p-0 text-text-secondary hover:text-text-primary"
        title="Zoom avant"
        @click="zoomIn()"
      >
        <span class="text-sm font-bold">+</span>
      </Button>

      <div class="mx-1 h-4 w-px bg-border-subtle" />

      <!-- Fit Button -->
      <Button
        size="xs"
        variant="ghost"
        class="h-7 px-2 text-xs text-text-secondary hover:text-text-primary gap-1"
        title="Ajuster le layout à l'écran"
        @click="handleAutoFit"
      >
        <Icon name="fullscreen" size="xs" />
        Fit
      </Button>

      <!-- Reset Zoom -->
      <Button
        size="xs"
        variant="ghost"
        class="h-7 px-2 text-xs text-text-secondary hover:text-text-primary"
        title="Réinitialiser (100%)"
        @click="resetView"
      >
        1:1
      </Button>
    </div>

    <!-- Viewport Left Toolbar (Gizmo / Guide Toggles) -->
    <div class="absolute left-4 top-4 z-50 flex items-center gap-2 rounded-xl border border-border-default bg-bg-surface/90 px-3 py-1.5 shadow-xl backdrop-blur-md">
      <div class="flex items-center gap-2 text-xs text-text-secondary">
        <span class="font-medium text-text-primary">Repères :</span>
        <Button
          size="xs"
          variant="ghost"
          class="rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
          :aria-pressed="showGuides"
          :class="showGuides ? 'bg-primary/20 text-primary font-bold border border-primary/30' : 'text-text-muted hover:text-text-secondary border border-transparent'"
          @click="showGuides = !showGuides"
        >
          Axes
        </Button>
        <Button
          size="xs"
          variant="ghost"
          class="rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
          :aria-pressed="showGizmos"
          :class="showGizmos ? 'bg-primary/20 text-primary font-bold border border-primary/30' : 'text-text-muted hover:text-text-secondary border border-transparent'"
          @click="showGizmos = !showGizmos"
        >
          Gizmos
        </Button>
        <Button
          size="xs"
          variant="ghost"
          class="rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
          :aria-pressed="showSprites"
          :class="showSprites ? 'bg-primary/20 text-primary font-bold border border-primary/30' : 'text-text-muted hover:text-text-secondary border border-transparent'"
          @click="showSprites = !showSprites"
        >
          Sprites
        </Button>
      </div>
    </div>

    <!-- Center Stage & Layout Canvas Container with Zoom & Pan Transform -->
    <div
      data-viewport-pan-surface="true"
      class="viewport-bg absolute inset-0 flex items-center justify-center"
      :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'"
    >
      <div
        data-testid="rig-calibration-stage"
        data-viewport-pan-surface="true"
        class="relative shrink-0 transition-transform duration-75 border border-white/10 shadow-2xl bg-black/40 rounded-sm"
        :style="{
          width: `${calibStageWidth}px`,
          height: `${calibStageHeight}px`,
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: 'center center'
        }"
      >
        <!-- Center Stage Axes Guidelines (Dashed Crosshairs through stage center) -->
        <template v-if="showGuides">
          <div
            class="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 border-l border-dashed border-white/20 z-15"
          />
          <div
            class="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 border-t border-dashed border-white/20 z-15"
          />
        </template>

        <!-- HTML5 Canvas 2D Rendering Engine (Exact Stage Resolution) -->
        <canvas
          ref="canvasRef"
          :width="calibStageWidth"
          :height="calibStageHeight"
          class="pointer-events-none absolute inset-0 z-10 select-none transition-opacity"
          :class="showSprites ? 'opacity-100' : 'opacity-0'"
        />

        <!-- Interactive Gizmos Overlay (Pixel-perfect alignment on Stage Layout) -->
        <template v-if="showGizmos">
          <!-- 1. Body Neck Anchor Target Gizmo -->
          <RigCalibrationGizmoNeck
            v-if="rigCatalog.calibrationTool === 'body'"
            :x="stageNeckPoint.x"
            :y="stageNeckPoint.y"
            :body-x="bodyX"
            :body-y="bodyY"
            :body-width="bodyWidth"
            :body-height="bodyHeight"
            :stage-width="calibStageWidth"
            :stage-height="calibStageHeight"
            :zoom="zoom"
            :show-guides="showGuides"
            @drag-start="beginCalibrationGesture('body')"
            @drag-end="commitCalibrationGesture"
            @update:point="onUpdateNeckPoint"
          />

          <!-- 2. Head Bounding Box & Scale/Rotation Handles Gizmo -->
          <RigCalibrationGizmoHead
            v-if="rigCatalog.calibrationTool === 'head'"
            :x="headStageTopLeft.x"
            :y="headStageTopLeft.y"
            :width="headDimensions.width"
            :height="headDimensions.height"
            :scale="headScale"
            :rotation="headRotation"
            :pivot-x="0.5"
            :pivot-y="0.5"
            :label="headAsset?.name ?? effectiveSeries?.label ?? 'Tête'"
            :zoom="zoom"
            @drag-start="beginCalibrationGesture('head')"
            @drag-end="commitCalibrationGesture"
            @update:transform="onUpdateHeadTransform"
          />

          <!-- 3. Anchored Part (Accessory / Mouth) Calibration Gizmo (Rendered Inside Head Space) -->
          <div
            v-if="
              effectiveSeries &&
              rigCatalog.calibrationTool === 'accessory' &&
              activeAnchoredAsset &&
              activeAnchoredCalibration
            "
            class="pointer-events-none absolute z-25"
            :style="{
              left: `${headVisualTopLeft.x}px`,
              top: `${headVisualTopLeft.y}px`,
              width: `${headDimensions.width}px`,
              height: `${headDimensions.height}px`,
              transformOrigin: 'center center',
              transform: `rotate(${headRotation}deg) scale(${headScale})`
            }"
          >
            <RigCalibrationGizmoAccessory
              :anchor="activeAnchorNormalized"
              :head-width="headDimensions.width"
              :head-height="headDimensions.height"
              :calibration="activeAnchoredCalibration"
              :asset-width="activeAnchoredAsset.width"
              :asset-height="activeAnchoredAsset.height"
              :head-scale="headScale"
              :head-rotation="headRotation"
              :zoom="zoom"
              :pivot-stage-x="activeAnchoredPivotStage?.x ?? stageNeckPoint.x"
              :pivot-stage-y="activeAnchoredPivotStage?.y ?? stageNeckPoint.y"
              :label="activeAnchoredAsset.name"
              :category="activeAnchoredAsset.category"
              :prop-slot="activeAnchoredAsset.characterPropSlot"
              @drag-start="beginCalibrationGesture('accessory')"
              @drag-end="commitCalibrationGesture"
              @update:calibration="onUpdateAccessoryCalibration"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
