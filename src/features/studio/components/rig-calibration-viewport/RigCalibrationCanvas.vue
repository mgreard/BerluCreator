<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, useTemplateRef, nextTick } from 'vue'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useRigRuntime } from '../../rig-calibration/useRigRuntime'
import { DEFAULT_STAGE_RESOLUTION } from '@core/constants/editor'
import { rigAssetKey } from '../../rig-calibration/rig-catalog.service'
import type { Asset, CharacterPropSlot, NormalizedPoint } from '@core/types/asset.types'
import { useRigViewportNavigation } from './useRigViewportNavigation'
import RigCalibrationGizmoNeck from './RigCalibrationGizmoNeck.vue'
import RigCalibrationGizmoHead from './RigCalibrationGizmoHead.vue'
import RigCalibrationGizmoAnchors from './RigCalibrationGizmoAnchors.vue'
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
  fitToViewport,
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
const selectedSeries = computed(() => rigCatalog.seriesById(rigCatalog.selectedHeadSeriesId))
const selectedRigSeriesConfig = computed(() =>
  selectedRig.value?.headSeries.find(
    (entry) => entry.seriesId === rigCatalog.selectedHeadSeriesId
  )
)

// Active Body Asset
const bodyAsset = computed<Asset | undefined>(() => {
  if (!selectedRig.value) return undefined
  return rigCatalog.resolveBodyAsset(selectedRig.value, assetStore.assets)
})

// Body Dimensions & Position on Stage Layout (Centered with natural margins)
const bodyWidth = computed(() => bodyAsset.value?.width ?? 334)
const bodyHeight = computed(() => bodyAsset.value?.height ?? 576)

const bodyX = computed(() => Math.round((stageWidth.value - bodyWidth.value) / 2))
const bodyY = computed(() => Math.round((stageHeight.value - bodyHeight.value) / 2))

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
const mouthAsset = computed<Asset | undefined>(() => {
  const series = selectedSeries.value
  if (!series?.defaultMouthAssetKey) return undefined
  return assetStore.assets.find(
    (a) => a.category === 'mouth' && rigAssetKey(a) === series.defaultMouthAssetKey
  )
})

// Active Accessory Asset
const activeAccessoryAsset = computed<Asset | undefined>(() => {
  if (assetStore.selectedAsset?.category === 'props_character') {
    return assetStore.selectedAsset
  }
  return undefined
})

// Neck Anchor Position (Local on body vs Global on Stage)
const localNeckPoint = computed(() => {
  return selectedRig.value?.neckAnchor ?? {
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

const headScale = computed(() => selectedRigSeriesConfig.value?.defaultScale ?? 0.22)
const headRotation = computed(() => selectedRigSeriesConfig.value?.defaultRotation ?? 0)

// Head Top-Left position (calibrated so series.neckPivot lands exactly on neckPoint)
const headLocalTopLeft = computed(() => {
  const pivot = selectedSeries.value?.neckPivot ?? { x: 0.5, y: 0.94 }
  return {
    x: localNeckPoint.value.x - pivot.x * headDimensions.value.width,
    y: localNeckPoint.value.y - pivot.y * headDimensions.value.height
  }
})

const headStageTopLeft = computed(() => {
  return {
    x: bodyX.value + headLocalTopLeft.value.x,
    y: bodyY.value + headLocalTopLeft.value.y
  }
})

const headRotationOrigin = computed(() => ({
  x:
    stageNeckPoint.value.x +
    (headStageTopLeft.value.x + headDimensions.value.width / 2 - stageNeckPoint.value.x) *
      headScale.value,
  y:
    stageNeckPoint.value.y +
    (headStageTopLeft.value.y + headDimensions.value.height / 2 - stageNeckPoint.value.y) *
      headScale.value
}))

const headVisualTopLeft = computed(() => ({
  x: headRotationOrigin.value.x - headDimensions.value.width / 2,
  y: headRotationOrigin.value.y - headDimensions.value.height / 2
}))

// Accessory Placement & Calibration
const accessorySlot = computed<CharacterPropSlot>(() => {
  return activeAccessoryAsset.value?.characterPropSlot ?? 'sunglass'
})

const accessoryAnchorNormalized = computed(() => {
  if (!selectedSeries.value) return { x: 0.5, y: 0.43 }
  return selectedSeries.value.propAnchors[accessorySlot.value] ?? { x: 0.5, y: 0.43 }
})

const accessoryCalibration = computed(() => {
  const series = selectedSeries.value
  const asset = activeAccessoryAsset.value
  if (!series || !asset) return null
  return asset.anchoredCalibrationBySeries?.[series.id] ?? {
    pivot: { x: 0.5, y: 0.5 },
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    rotation: 0
  }
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

const accessoryPivotStage = computed(() => {
  const series = selectedSeries.value
  const calibration = accessoryCalibration.value
  if (!series || !calibration) return null
  const anchor = series.propAnchors[accessorySlot.value] ?? { x: 0.5, y: 0.43 }
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
  if (headAsset.value && selectedSeries.value) {
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

    // 3. Mouth Layer
    if (mouthAsset.value) {
      const anchor = selectedSeries.value.mouthAnchor
      const mouthW = mouthAsset.value.width
      const mouthH = mouthAsset.value.height
      const anchorPoint = transformPointAround(
        { x: headLayer.x + anchor.x * headW, y: headLayer.y + anchor.y * headH },
        { x: headLayer.transformOriginX, y: headLayer.transformOriginY },
        headLayer.scaleX,
        headLayer.scaleY,
        headLayer.rotation,
        {
          x: headLayer.rotationOriginX ?? headLayer.transformOriginX,
          y: headLayer.rotationOriginY ?? headLayer.transformOriginY
        }
      )
      layers.push({
        id: 'calibration-mouth',
        layerId: 'calibration-mouth',
        name: mouthAsset.value.name,
        category: 'mouth',
        groupId: 'calibration-rig',
        groupName: selectedRig.value?.name ?? 'Rig',
        groupKind: 'character',
        stagePlane: 'rear',
        groupZIndex: 10,
        layerZIndex: 22,
        sceneZIndex: 10,
        order: 2,
        asset: mouthAsset.value,
        zIndex: 22,
        muted: false,
        locked: false,
        isMovable: false,
        depthRole: 'subject',
        opticalDepth: 0.5,
        x: Math.round(anchorPoint.x - mouthW / 2),
        y: Math.round(anchorPoint.y - mouthH / 2),
        width: mouthW,
        height: mouthH,
        transformOriginX: anchorPoint.x,
        transformOriginY: anchorPoint.y,
        scaleX: headLayer.scaleX,
        scaleY: headLayer.scaleY,
        localX: anchor.x * headW - mouthW / 2,
        localY: anchor.y * headH - mouthH / 2,
        localScaleX: 1,
        localScaleY: 1,
        localRotation: 0,
        rotation: headLayer.rotation,
        opacity: 1
      })
    }

    // 4. Accessory Layer
    if (activeAccessoryAsset.value && accessoryCalibration.value) {
      const slot = activeAccessoryAsset.value.characterPropSlot ?? 'sunglass'
      const anchor = selectedSeries.value.propAnchors[slot] ?? { x: 0.5, y: 0.43 }
      const calib = accessoryCalibration.value
      const centerX = accessoryPivotStage.value?.x ?? stageNeckPoint.value.x
      const centerY = accessoryPivotStage.value?.y ?? stageNeckPoint.value.y
      const accW = activeAccessoryAsset.value.width
      const accH = activeAccessoryAsset.value.height

      layers.push({
        id: 'calibration-accessory',
        layerId: 'calibration-accessory',
        name: activeAccessoryAsset.value.name,
        category: 'props_character',
        groupId: 'calibration-rig',
        groupName: selectedRig.value?.name ?? 'Rig',
        groupKind: 'character',
        stagePlane: 'rear',
        groupZIndex: 10,
        layerZIndex: 25,
        sceneZIndex: 10,
        order: 3,
        asset: activeAccessoryAsset.value,
        zIndex: 25,
        muted: false,
        locked: false,
        isMovable: false,
        depthRole: 'subject',
        opticalDepth: 0.5,
        x: Math.round(centerX - accW * calib.pivot.x),
        y: Math.round(centerY - accH * calib.pivot.y),
        width: accW,
        height: accH,
        transformOriginX: centerX,
        transformOriginY: centerY,
        scaleX: headLayer.scaleX * calib.scale,
        scaleY: headLayer.scaleY * calib.scale,
        localX: anchor.x * headW + calib.offsetX - accW * calib.pivot.x,
        localY: anchor.y * headH + calib.offsetY - accH * calib.pivot.y,
        localScaleX: calib.scale,
        localScaleY: calib.scale,
        localRotation: calib.rotation,
        rotation: headLayer.rotation + calib.rotation,
        opacity: 1
      })
    }
  }

  return layers
})

// Draw to Canvas 2D
async function renderCanvas(): Promise<void> {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const loadPromises = renderableLayers.value.map((layer) =>
    fetchAndLoadImage(layer.asset.blobId, globalImageCache)
  )
  await Promise.allSettled(loadPromises)

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  drawLayersOnContext(ctx, renderableLayers.value, globalImageCache)
}

watch(
  [renderableLayers, stageWidth, stageHeight],
  () => {
    nextTick(() => {
      void renderCanvas()
    })
  },
  { immediate: true, deep: true }
)

// Update Handlers
function onUpdateNeckPoint(localPoint: { x: number; y: number }): void {
  if (!selectedRig.value) return
  rigCatalog.updateRigGeometry(selectedRig.value.id, {
    neckAnchor: { x: Math.round(localPoint.x), y: Math.round(localPoint.y) }
  })
  rigRuntime.syncRigLayers(selectedRig.value.id)
}

function onUpdateHeadTransform(patch: { x?: number; y?: number; scale?: number; rotation?: number }): void {
  const rig = selectedRig.value
  const series = selectedSeries.value
  if (!rig || !series) return

  if (patch.x !== undefined || patch.y !== undefined) {
    const pivot = series.neckPivot
    // Convert stage head top-left to body local coordinates
    const localHeadX = patch.x !== undefined ? patch.x - bodyX.value : headLocalTopLeft.value.x
    const localHeadY = patch.y !== undefined ? patch.y - bodyY.value : headLocalTopLeft.value.y
    const newNeckX = Math.round(localHeadX + pivot.x * headDimensions.value.width)
    const newNeckY = Math.round(localHeadY + pivot.y * headDimensions.value.height)

    rigCatalog.updateRigGeometry(rig.id, {
      neckAnchor: { x: newNeckX, y: newNeckY }
    })
  }

  if (patch.scale !== undefined || patch.rotation !== undefined) {
    rigCatalog.updateSeriesDefaults(rig.id, series.id, {
      ...(patch.scale !== undefined ? { defaultScale: Number(patch.scale.toFixed(4)) } : {}),
      ...(patch.rotation !== undefined ? { defaultRotation: Math.round(patch.rotation) } : {})
    })
  }

  rigRuntime.syncRigLayers(rig.id)
}

function onUpdateAnchor(payload: {
  anchor: 'neckPivot' | 'mouthAnchor' | CharacterPropSlot
  point: NormalizedPoint
}): void {
  if (!selectedSeries.value || !selectedRig.value) return
  rigCatalog.updateSeriesAnchor(selectedSeries.value.id, payload.anchor, payload.point)
  rigRuntime.syncRigLayers(selectedRig.value.id)
}

async function onUpdateAccessoryCalibration(patch: Partial<NonNullable<typeof accessoryCalibration.value>>): Promise<void> {
  const series = selectedSeries.value
  const asset = activeAccessoryAsset.value
  const current = accessoryCalibration.value
  if (!series || !asset || !current) return

  const updated = {
    ...current,
    ...patch
  }

  await assetStore.updateAsset(asset.id, {
    anchoredCalibrationBySeries: {
      ...asset.anchoredCalibrationBySeries,
      [series.id]: updated
    }
  })
}

function handleAutoFit(): void {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  fitToViewport(rect.width, rect.height, stageWidth.value, stageHeight.value)
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
  scheduleAutoFit()
  if (typeof ResizeObserver !== 'undefined' && containerRef.value) {
    containerResizeObserver = new ResizeObserver(scheduleAutoFit)
    containerResizeObserver.observe(containerRef.value)
  } else {
    window.addEventListener('resize', scheduleAutoFit)
  }
})

onUnmounted(() => {
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
          width: `${stageWidth}px`,
          height: `${stageHeight}px`,
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
          :width="stageWidth"
          :height="stageHeight"
          class="pointer-events-none absolute inset-0 z-10 select-none transition-opacity"
          :class="showSprites ? 'opacity-100' : 'opacity-0'"
        />

        <!-- Interactive Gizmos Overlay (Pixel-perfect alignment on Stage Layout) -->
        <template v-if="showGizmos">
          <!-- 1. Body Neck Anchor Target Gizmo -->
          <RigCalibrationGizmoNeck
            :x="stageNeckPoint.x"
            :y="stageNeckPoint.y"
            :body-x="bodyX"
            :body-y="bodyY"
            :body-width="bodyWidth"
            :body-height="bodyHeight"
            :stage-width="stageWidth"
            :stage-height="stageHeight"
            :zoom="zoom"
            :show-guides="showGuides"
            @update:point="onUpdateNeckPoint"
          />

          <!-- 2. Head Bounding Box & Scale/Rotation Handles Gizmo -->
          <RigCalibrationGizmoHead
            :x="headStageTopLeft.x"
            :y="headStageTopLeft.y"
            :width="headDimensions.width"
            :height="headDimensions.height"
            :scale="headScale"
            :rotation="headRotation"
            :pivot-x="selectedSeries?.neckPivot.x ?? 0.5"
            :pivot-y="selectedSeries?.neckPivot.y ?? 0.94"
            :label="headAsset?.name ?? selectedSeries?.label ?? 'Tête'"
            :zoom="zoom"
            @update:transform="onUpdateHeadTransform"
          />

          <!-- 3. Head Series Anchor Pins Gizmo (Rendered Inside Head Space) -->
          <div
            v-if="selectedSeries"
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
            <RigCalibrationGizmoAnchors
              :series="selectedSeries"
              :head-width="headDimensions.width"
              :head-height="headDimensions.height"
              :head-scale="headScale"
              :head-rotation="headRotation"
              :zoom="zoom"
              @update:anchor="onUpdateAnchor"
            />

            <!-- 4. Accessory Calibration Gizmo (Rendered Inside Head Space) -->
            <RigCalibrationGizmoAccessory
              v-if="activeAccessoryAsset && accessoryCalibration"
              :anchor="accessoryAnchorNormalized"
              :head-width="headDimensions.width"
              :head-height="headDimensions.height"
              :calibration="accessoryCalibration"
              :asset-width="activeAccessoryAsset.width"
              :asset-height="activeAccessoryAsset.height"
              :head-scale="headScale"
              :head-rotation="headRotation"
              :zoom="zoom"
              :pivot-stage-x="accessoryPivotStage?.x ?? stageNeckPoint.x"
              :pivot-stage-y="accessoryPivotStage?.y ?? stageNeckPoint.y"
              :label="activeAccessoryAsset.name"
              @update:calibration="onUpdateAccessoryCalibration"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
