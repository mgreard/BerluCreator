<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted, watch, nextTick, useId } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { getCachedAssetImage, useCanvasRenderer } from '../composables/useCanvasRenderer'
import { isLayerPointOpaque } from '../engine/alpha-hit-test'
import { isActiveSelectionHit, shouldTargetWholeGroup } from '../engine/selection-target'
import { clampBackgroundCover } from '../engine/background-cover.engine'
import { resolveStagePlacementZIndexes } from '../engine/stage-layer-placement'
import {
  computeResizeScales,
  computeTransformedBounds,
  type BoxBounds,
  type ResizeHandle
} from '../engine/transform-matrix'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Badge } from '@/components/ui/badge'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { CameraFrameOverlay } from '@/components/ui/camera-frame-overlay'
import {
  DepthOfFieldOverlay,
  type DepthOfFieldOverlayValue
} from '@/components/ui/depth-of-field-overlay'
import type { CameraFrame, CharacterGroup } from '@core/types/editor.types'
import { OPTICAL_DEPTH_PRESETS } from '@core/constants/editor'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { useRigRuntime } from '../rig-calibration/useRigRuntime'
import { useBoundedFloatingPanel } from '@/shared/composables/useBoundedFloatingPanel'

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const assetStore = useAssetStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const stageViewportRef = useTemplateRef<HTMLDivElement>('stageViewport')
const viewportHudRef = useTemplateRef<HTMLDivElement>('viewportHud')
const opticalDepthPanelRef = useTemplateRef<HTMLElement>('opticalDepthPanel')
const opticalDepthPanelTitleId = useId()
const { activeLayers } = useHierarchyResolver()
const isRigCalibrationOpen = computed(() => rigCatalog.isCalibrationOpen)

const viewportHudFloating = useBoundedFloatingPanel(
  stageViewportRef,
  viewportHudRef,
  { left: '12px', bottom: '12px' },
  8
)
const opticalDepthFloating = useBoundedFloatingPanel(
  stageViewportRef,
  opticalDepthPanelRef,
  { right: '12px', bottom: '72px' },
  8
)

const activeCalibrationGroup = computed<CharacterGroup | null>(() => {
  const selected = editorStore.currentDocument.groups.find(
    (group): group is CharacterGroup =>
      group.kind === 'character' && group.id === editorStore.selectedGroupId
  )
  return (
    selected ??
    editorStore.currentDocument.groups.find(
      (group): group is CharacterGroup => group.kind === 'character' && group.activeMode === 'rig'
    ) ??
    null
  )
})

// Les personnages utilisent le scope groupe ; tous les éléments de plateau restent atomiques.
const editScope = computed(() => editorStore.editScope)

const selectedLayerId = computed(() => editorStore.selectedLayerId)

const activeSelectedLayer = computed(() => {
  if (editorStore.selectedLayerId) {
    const selected = activeLayers.value.find(
      (layer) => layer.layerId === editorStore.selectedLayerId
    )
    if (selected) return selected
  }

  if (editorStore.editScope === 'group' && editorStore.selectedGroupId) {
    return activeLayers.value.find((layer) => layer.groupId === editorStore.selectedGroupId) ?? null
  }

  return null
})

const activeSelectedGroup = computed(() => {
  if (editorStore.selectedGroupId) {
    return (
      editorStore.currentDocument.groups.find(
        (group) => group.id === editorStore.selectedGroupId
      ) ?? null
    )
  }
  if (activeSelectedLayer.value?.groupId) {
    return (
      editorStore.currentDocument.groups.find(
        (group) => group.id === activeSelectedLayer.value?.groupId
      ) ?? null
    )
  }
  return null
})

const isGroupTarget = computed(() => {
  return editScope.value === 'group' && Boolean(activeSelectedGroup.value)
})

function openRigCalibration(): void {
  const group = activeCalibrationGroup.value
  if (!group) return
  const rig = rigRuntime.activeRigForGroup(group) ?? rigCatalog.defaultRig(group.characterKey)
  if (!rig) {
    toast.warning('Rig indisponible', 'Aucune configuration de corps n’est disponible.')
    return
  }
  let preferredLayer =
    editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && !layer.muted && layer.category === 'body'
    ) ??
    editorStore.currentDocument.layers.find(
      (layer) => layer.groupId === group.id && !layer.muted && layer.category !== 'character_full'
    )
  if (!preferredLayer || group.activeMode !== 'rig') {
    preferredLayer = rigRuntime.activateRig(rig) ?? undefined
  }
  if (!preferredLayer) return
  rigCatalog.selectedRigId = rig.id
  rigCatalog.openCalibration(rig.id)
  editorStore.selectRigLayerForCalibration(preferredLayer.id)
  assetStore.selectAsset(preferredLayer.assetId)
}

function closeRigCalibration(): void {
  rigCatalog.closeCalibration()
  const group = activeCalibrationGroup.value
  if (group) editorStore.selectGroupForEditing(group.id)
}

function toggleRigCalibration(): void {
  if (isRigCalibrationOpen.value) closeRigCalibration()
  else openRigCalibration()
}

async function persistLayerCalibration(layer: RenderableLayer): Promise<void> {
  const sourceLayer = editorStore.currentDocument.layers.find(
    (candidate) => candidate.id === layer.layerId
  )
  const group = editorStore.currentDocument.groups.find(
    (candidate): candidate is CharacterGroup =>
      candidate.id === layer.groupId && candidate.kind === 'character'
  )
  const rig = group
    ? (rigCatalog.rigById(group.activeRigId) ?? rigRuntime.activeRigForGroup(group))
    : undefined
  if (!sourceLayer || !rig || !rigCatalog.partForAsset(rig, layer.asset)) return
  const calibration = {
    x: Math.round(sourceLayer.transform.x),
    y: Math.round(sourceLayer.transform.y),
    scaleX: sourceLayer.transform.scaleX,
    scaleY: sourceLayer.transform.scaleY,
    rotation: sourceLayer.transform.rotation,
    zIndex: sourceLayer.zIndex
  }
  rigCatalog.savePartCalibration(rig.id, layer.asset, calibration)
}

const isSelectionLocked = computed(() =>
  isGroupTarget.value
    ? Boolean(activeSelectedGroup.value?.locked)
    : Boolean(activeSelectedLayer.value?.locked)
)

const activeCamera = computed<CameraFrame>({
  get: () => editorStore.currentDocument.camera,
  set: (camera) => editorStore.updateCamera(camera)
})

const depthOfField = computed(() => editorStore.currentDocument.depthOfField)
const isDepthOfFieldEditorOpen = ref(false)
const isOpticalDepthEditorOpen = ref(false)
let depthOfFieldFrame: number | null = null
let pendingDepthOfField: DepthOfFieldOverlayValue | null = null
let hasDepthOfFieldGesture = false
let opticalDepthFrame: number | null = null
let pendingOpticalDepth: { layerId: string; value: number } | null = null
let hasOpticalDepthGesture = false

const showSelection = computed(() => !activeCamera.value.enabled)

const deskPlacementOptions: SegmentOption[] = [
  { value: 'behind', label: 'Derrière', icon: 'flip_to_back' },
  { value: 'front', label: 'Devant', icon: 'flip_to_front' }
]

const opticalDepthPresetOptions: SegmentOption[] = [
  { value: 'far', label: 'Décor', icon: 'landscape' },
  { value: 'focus', label: 'Sujet', icon: 'center_focus_strong' },
  { value: 'near', label: 'Proche', icon: 'filter_frames' }
]

const deskReferenceZIndex = computed(() => {
  const visibleDesk = editorStore.currentDocument.layers.find((layer) => {
    if (layer.category !== 'desk' || layer.muted) return false
    const group = editorStore.currentDocument.groups.find(
      (candidate) => candidate.id === layer.groupId
    )
    return !group?.muted
  })
  return visibleDesk?.zIndex ?? ASSET_CATEGORIES.desk.defaultZIndex
})

const stagePlacementZIndexes = computed(() => {
  return resolveStagePlacementZIndexes(
    deskReferenceZIndex.value,
    editorStore.currentDocument.groups
  )
})

const canEditSelectedDeskPlacement = computed(
  () => editScope.value === 'layer' && editorStore.selectedLayer?.category === 'props_set'
)

const selectedDeskPlacement = computed<string>({
  get: () =>
    (editorStore.selectedLayer?.zIndex ?? ASSET_CATEGORIES.props_set.defaultZIndex) <=
    stagePlacementZIndexes.value.behind
      ? 'behind'
      : 'front',
  set: (value) => {
    const layer = editorStore.selectedLayer
    if (!layer || (value !== 'behind' && value !== 'front')) return
    editorStore.updateLayerZIndex(layer.id, stagePlacementZIndexes.value[value])
  }
})

const canEditSelectedOpticalDepth = computed(() => {
  const category = editorStore.selectedLayer?.category
  return (
    depthOfField.value.enabled &&
    editScope.value === 'layer' &&
    (category === 'props_set' || category === 'foreground')
  )
})

function resolvedSelectedOpticalDepth(): number {
  const layer = editorStore.selectedLayer
  if (!layer) return OPTICAL_DEPTH_PRESETS.focus
  if (Number.isFinite(layer.opticalDepth)) {
    return Math.max(0, Math.min(1, layer.opticalDepth!))
  }
  return layer.category !== 'foreground' && layer.depthRole === 'background'
    ? OPTICAL_DEPTH_PRESETS.far
    : OPTICAL_DEPTH_PRESETS.focus
}

const selectedOpticalDepthPercent = computed(() =>
  Math.round(resolvedSelectedOpticalDepth() * 100)
)

const selectedOpticalDepthLabel = computed(() => {
  const percent = selectedOpticalDepthPercent.value
  if (Math.abs(percent - 50) <= 5) return 'Plan net'
  if (percent < 50) return percent <= 10 ? 'Arrière-plan' : 'Plan intermédiaire'
  return percent >= 90 ? 'Très proche' : 'Premier plan'
})

const selectedOpticalPreset = computed<string>({
  get: () => {
    const depth = resolvedSelectedOpticalDepth()
    if (Math.abs(depth - OPTICAL_DEPTH_PRESETS.far) < 0.001) return 'far'
    if (Math.abs(depth - OPTICAL_DEPTH_PRESETS.focus) < 0.001) return 'focus'
    if (Math.abs(depth - OPTICAL_DEPTH_PRESETS.near) < 0.001) return 'near'
    return 'custom'
  },
  set: (preset) => {
    const layer = editorStore.selectedLayer
    if (!layer) return
    if (preset === 'far') editorStore.setLayerDepthRole(layer.id, 'background')
    else if (preset === 'focus') editorStore.setLayerDepthRole(layer.id, 'subject')
    else if (preset === 'near') {
      editorStore.setLayerOpticalDepth(layer.id, OPTICAL_DEPTH_PRESETS.near)
    }
  }
})

function scalarValue(value: number | number[]): number {
  return Array.isArray(value) ? (value[0] ?? 50) : value
}

function beginOpticalDepthInteraction() {
  if (hasOpticalDepthGesture) return
  hasOpticalDepthGesture = true
  editorStore.beginGesture('Régler la distance caméra')
}

function flushOpticalDepthUpdate() {
  opticalDepthFrame = null
  const pending = pendingOpticalDepth
  pendingOpticalDepth = null
  if (pending) editorStore.setLayerOpticalDepth(pending.layerId, pending.value)
}

function scheduleOpticalDepthUpdate(value: number | number[]) {
  const layer = editorStore.selectedLayer
  if (!layer) return
  pendingOpticalDepth = {
    layerId: layer.id,
    value: Math.max(0, Math.min(100, scalarValue(value))) / 100
  }
  if (opticalDepthFrame !== null) return
  opticalDepthFrame = window.requestAnimationFrame(flushOpticalDepthUpdate)
}

function finishOpticalDepthInteraction() {
  if (opticalDepthFrame !== null) {
    window.cancelAnimationFrame(opticalDepthFrame)
    opticalDepthFrame = null
  }
  flushOpticalDepthUpdate()
  if (hasOpticalDepthGesture) {
    hasOpticalDepthGesture = false
    editorStore.endGesture()
  }
}

function beginOpticalDepthKeyboard(event: KeyboardEvent) {
  if (
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(
      event.key
    )
  ) {
    beginOpticalDepthInteraction()
  }
}

function resetSelectedOpticalDepth() {
  const layer = editorStore.selectedLayer
  if (!layer) return
  editorStore.setLayerDepthRole(layer.id, 'auto')
}

function toggleOpticalDepthEditor() {
  isOpticalDepthEditorOpen.value = !isOpticalDepthEditorOpen.value
  if (isOpticalDepthEditorOpen.value) {
    void nextTick(() => opticalDepthFloating.constrain())
  } else {
    finishOpticalDepthInteraction()
  }
}

watch(selectedLayerId, () => {
  finishOpticalDepthInteraction()
  isOpticalDepthEditorOpen.value = false
})

function toggleCameraFrame() {
  const current = activeCamera.value
  const enabled = !current.enabled
  const frameFitsStage =
    current.width >= 64 &&
    current.height >= 64 &&
    current.x >= 0 &&
    current.y >= 0 &&
    current.x + current.width <= stage.value.width &&
    current.y + current.height <= stage.value.height

  editorStore.clearStudioSelection()
  editorStore.updateCamera(
    frameFitsStage
      ? { ...current, enabled }
      : {
          enabled,
          x: 0,
          y: 0,
          width: stage.value.width,
          height: stage.value.height,
          aspectRatio: 'custom'
        }
  )
}

function commitCameraFrame(camera: CameraFrame) {
  editorStore.updateCamera(camera)
}

function toggleDepthOfField() {
  const enabled = !depthOfField.value.enabled
  editorStore.updateDepthOfField({ enabled })
  isDepthOfFieldEditorOpen.value = enabled
}

function toggleDepthOfFieldEditor() {
  if (!depthOfField.value.enabled) return
  isDepthOfFieldEditorOpen.value = !isDepthOfFieldEditorOpen.value
}

function beginDepthOfFieldInteraction(label: string) {
  if (hasDepthOfFieldGesture) return
  hasDepthOfFieldGesture = true
  editorStore.beginGesture(label)
}

function flushDepthOfFieldUpdate() {
  depthOfFieldFrame = null
  const next = pendingDepthOfField
  pendingDepthOfField = null
  if (next) editorStore.updateDepthOfField(next)
}

function scheduleDepthOfFieldUpdate(value: DepthOfFieldOverlayValue) {
  pendingDepthOfField = value
  if (depthOfFieldFrame !== null) return
  depthOfFieldFrame = window.requestAnimationFrame(flushDepthOfFieldUpdate)
}

function commitDepthOfFieldUpdate(value: DepthOfFieldOverlayValue) {
  pendingDepthOfField = value
  if (depthOfFieldFrame !== null) {
    window.cancelAnimationFrame(depthOfFieldFrame)
    depthOfFieldFrame = null
  }
  flushDepthOfFieldUpdate()
  if (hasDepthOfFieldGesture) {
    hasDepthOfFieldGesture = false
    editorStore.endGesture()
  }
}

// Calcul des bornes englobantes (Bounding Box) du groupe ou du calque individuel
const selectedBounds = computed<BoxBounds | null>(() => {
  if (!activeSelectedLayer.value) return null

  if (isGroupTarget.value && activeSelectedGroup.value) {
    const groupLayers = activeLayers.value.filter(
      (l) => l.groupId === activeSelectedGroup.value?.id
    )
    if (groupLayers.length === 0) {
      const l = activeSelectedLayer.value
      return computeTransformedBounds(
        l.x,
        l.y,
        l.width,
        l.height,
        l.scaleX,
        l.scaleY,
        l.transformOriginX,
        l.transformOriginY
      )
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const l of groupLayers) {
      const b = computeTransformedBounds(
        l.x,
        l.y,
        l.width,
        l.height,
        l.scaleX,
        l.scaleY,
        l.transformOriginX,
        l.transformOriginY
      )
      minX = Math.min(minX, b.x)
      minY = Math.min(minY, b.y)
      maxX = Math.max(maxX, b.x + b.width)
      maxY = Math.max(maxY, b.y + b.height)
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(20, maxX - minX),
      height: Math.max(20, maxY - minY)
    }
  }

  // Calque unique
  const l = activeSelectedLayer.value
  return computeTransformedBounds(
    l.x,
    l.y,
    l.width,
    l.height,
    l.scaleX,
    l.scaleY,
    l.transformOriginX,
    l.transformOriginY
  )
})

// Libellé informatif affiché sur la boîte de sélection
const targetLabel = computed<string | null>(() => {
  if (!activeSelectedLayer.value) return null
  if (isGroupTarget.value && activeSelectedGroup.value) {
    const scale = Math.abs(activeSelectedGroup.value.transform.scaleX)
    const flipSuffix = activeSelectedGroup.value.transform.scaleX < 0 ? ' [Flip H]' : ''
    return `Groupe : ${activeSelectedGroup.value.name} (${scale.toFixed(2)}×${flipSuffix})`
  }
  const l = activeSelectedLayer.value
  const scale = Math.abs(l.localScaleX)
  const flipSuffix = l.localScaleX < 0 ? ' [Flip H]' : ''
  return `${l.name || l.asset.name} (${scale.toFixed(2)}×${flipSuffix})`
})

const deleteSelectionLabel = computed(() => {
  if (activeSelectedGroup.value?.kind === 'character' && isGroupTarget.value) {
    return activeSelectedGroup.value.activeMode === 'full'
      ? `Supprimer le sprite complet de ${activeSelectedGroup.value.name}`
      : `Supprimer le rig complet de ${activeSelectedGroup.value.name}`
  }
  return `Supprimer ${activeSelectedLayer.value?.asset.name || 'cet élément'}`
})

// Envoi vers le moteur de rendu canvas
useCanvasRenderer(
  canvasRef,
  activeLayers,
  stage,
  selectedLayerId,
  selectedBounds,
  targetLabel,
  isGroupTarget,
  showSelection,
  depthOfField
)

// --- GESTION DU DRAG & DROP ET DU REDIMENSIONNEMENT INTERACTIF ---
const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const activeHandle = ref<ResizeHandle | null>(null)
const hoveredHandle = ref<ResizeHandle | null>(null)
const hoveredLayer = ref<RenderableLayer | null>(null)

const dragStartPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartBounds = ref<BoxBounds>({ x: 0, y: 0, width: 0, height: 0 })
const dragStartScale = ref({ x: 1, y: 1 })
const dragStartRotation = ref(0)
const dragStartAngleRad = ref(0)
const dragStartLayerPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartGroupPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })

const currentScale = computed(() => {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    return Math.abs(activeSelectedGroup.value.transform.scaleX)
  }
  return Math.abs(activeSelectedLayer.value?.localScaleX ?? activeSelectedLayer.value?.scaleX ?? 1)
})

const resizeCursorClass = computed(() => {
  const handle = activeHandle.value ?? hoveredHandle.value
  if (handle === 'rot') return 'cursor-grab'
  if (handle === 'left' || handle === 'right') return 'cursor-ew-resize'
  if (handle === 'top' || handle === 'bottom') return 'cursor-ns-resize'
  if (handle === 'tl' || handle === 'br') return 'cursor-nwse-resize'
  if (handle === 'tr' || handle === 'bl') return 'cursor-nesw-resize'
  if (isRotating.value) return 'cursor-grabbing'
  if (isDragging.value) return 'cursor-grabbing'
  if (hoveredLayer.value) return 'cursor-grab'
  return 'cursor-default'
})

function undoCanvasTransform() {
  if (!isDragging.value && !isResizing.value) {
    editorStore.undo()
  }
}

function redoCanvasTransform() {
  if (!isDragging.value && !isResizing.value) {
    editorStore.redo()
  }
}

function onHistoryKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  if (
    target?.isContentEditable ||
    target?.tagName === 'INPUT' ||
    target?.tagName === 'TEXTAREA' ||
    target?.tagName === 'SELECT'
  ) {
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    if (editorStore.hasActiveGesture) {
      editorStore.cancelGesture()
    } else if (isRigCalibrationOpen.value) {
      closeRigCalibration()
    } else {
      editorStore.clearStudioSelection()
    }
    return
  }
  if (
    isRigCalibrationOpen.value &&
    editorStore.selectedLayer &&
    ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
  ) {
    event.preventDefault()
    const step = event.shiftKey ? 10 : 1
    const transform = editorStore.selectedLayer.transform
    editorStore.updateLayerTransform(editorStore.selectedLayer.id, {
      x: transform.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
      y: transform.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)
    })
    if (activeSelectedLayer.value) void persistLayerCalibration(activeSelectedLayer.value)
    return
  }
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return

  const key = event.key.toLowerCase()
  if (key === 'z' && event.shiftKey && editorStore.canRedo) {
    event.preventDefault()
    redoCanvasTransform()
  } else if (key === 'z' && editorStore.canUndo) {
    event.preventDefault()
    undoCanvasTransform()
  } else if (key === 'y' && editorStore.canRedo) {
    event.preventDefault()
    redoCanvasTransform()
  }
}

onMounted(() => window.addEventListener('keydown', onHistoryKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', onHistoryKeydown)
  if (depthOfFieldFrame !== null) window.cancelAnimationFrame(depthOfFieldFrame)
  if (pendingDepthOfField) editorStore.updateDepthOfField(pendingDepthOfField)
  if (hasDepthOfFieldGesture) editorStore.endGesture()
  if (opticalDepthFrame !== null) window.cancelAnimationFrame(opticalDepthFrame)
  flushOpticalDepthUpdate()
  if (hasOpticalDepthGesture) editorStore.endGesture()
})

const isSelectedFlippedHorizontally = computed(() => {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    return activeSelectedGroup.value.transform.scaleX < 0
  }
  if (activeSelectedLayer.value) {
    const rawScaleX = activeSelectedLayer.value.localScaleX ?? activeSelectedLayer.value.scaleX ?? 1
    return rawScaleX < 0
  }
  return false
})

function flipSelectedHorizontal() {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    editorStore.toggleGroupHorizontalFlip(activeSelectedGroup.value.id)
  } else if (activeSelectedLayer.value) {
    editorStore.toggleLayerHorizontalFlip(activeSelectedLayer.value.layerId)
    if (isRigCalibrationOpen.value) {
      void persistLayerCalibration(activeSelectedLayer.value)
    }
  }
}

function clampScale(value: number) {
  return Number(Math.max(0.05, Math.min(5, value)).toFixed(2))
}

function applyUniformScale(newScale: number) {
  const scale = clampScale(newScale)
  const isFlipped = isSelectedFlippedHorizontally.value
  const scaleX = isFlipped ? -scale : scale
  const scaleY = scale

  if (isGroupTarget.value && activeSelectedGroup.value) {
    editorStore.updateGroupTransform(activeSelectedGroup.value.id, {
      scaleX,
      scaleY
    })
  } else if (activeSelectedLayer.value) {
    editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, {
      scaleX,
      scaleY
    })
  }
}

function removeSelectedFromViewport() {
  const layer = activeSelectedLayer.value
  if (!layer) return

  const group = activeSelectedGroup.value
  if (isGroupTarget.value && group?.kind === 'character') {
    editorStore.removeActiveCharacterRepresentation(group.id)
  } else {
    editorStore.removeLayer(layer.layerId)
  }
  assetStore.selectAsset(null)
}

function getStageCoordinates(e: PointerEvent): { x: number; y: number } | null {
  if (!canvasRef.value) return null
  const rect = canvasRef.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  const scaleX = stage.value.width / rect.width
  const scaleY = stage.value.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

function hitTestResizeHandle(
  pos: { x: number; y: number },
  bounds: BoxBounds
): ResizeHandle | null {
  const handleRadius = 10
  const centerX = bounds.x + bounds.width / 2
  const centerY = bounds.y + bounds.height / 2
  const rotY = bounds.y - 24

  // Vérifier d'abord la poignée de rotation
  const distRot = Math.hypot(pos.x - centerX, pos.y - rotY)
  if (distRot <= 12) {
    return 'rot'
  }

  const handles: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: 'tl', x: bounds.x, y: bounds.y },
    { handle: 'tr', x: bounds.x + bounds.width, y: bounds.y },
    { handle: 'bl', x: bounds.x, y: bounds.y + bounds.height },
    { handle: 'br', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
    { handle: 'top', x: centerX, y: bounds.y },
    { handle: 'right', x: bounds.x + bounds.width, y: centerY },
    { handle: 'bottom', x: centerX, y: bounds.y + bounds.height },
    { handle: 'left', x: bounds.x, y: centerY }
  ]

  for (const handle of handles) {
    const dist = Math.hypot(pos.x - handle.x, pos.y - handle.y)
    if (dist <= handleRadius) {
      return handle.handle
    }
  }
  return null
}

function hitTestLayer(pos: { x: number; y: number }): RenderableLayer | null {
  const reversed = [...activeLayers.value].reverse()

  for (const layer of reversed) {
    const isFullScreenBg =
      layer.category === 'background' ||
      (layer.category === 'foreground' && !layer.isMovable) ||
      (layer.width >= stage.value.width * 0.95 &&
        layer.height >= stage.value.height * 0.95 &&
        !layer.isMovable)

    if (isFullScreenBg) continue

    const image = getCachedAssetImage(layer.asset.blobId)
    if (image && isLayerPointOpaque(layer, pos, image)) {
      return layer
    }

    if (!image) {
      const b = computeTransformedBounds(
        layer.x,
        layer.y,
        layer.width,
        layer.height,
        layer.scaleX,
        layer.scaleY,
        layer.transformOriginX,
        layer.transformOriginY
      )
      if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
        return layer
      }
    }
  }

  return null
}

function onCanvasPointerDown(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // 1. Clic sur l'une des poignées de transformation (rotation ou redimensionnement)
  if (selectedBounds.value && !isSelectionLocked.value) {
    const hitHandle = hitTestResizeHandle(pos, selectedBounds.value)
    if (hitHandle === 'rot') {
      editorStore.beginGesture('Pivoter la sélection')
      isRotating.value = true
      activeHandle.value = 'rot'
      const centerX = selectedBounds.value.x + selectedBounds.value.width / 2
      const centerY = selectedBounds.value.y + selectedBounds.value.height / 2
      dragStartAngleRad.value = Math.atan2(pos.y - centerY, pos.x - centerX)

      if (isGroupTarget.value && activeSelectedGroup.value) {
        dragStartRotation.value = activeSelectedGroup.value.transform.rotation ?? 0
      } else if (activeSelectedLayer.value) {
        dragStartRotation.value =
          activeSelectedLayer.value.localRotation ??
          activeSelectedLayer.value.rotation ??
          0
      }

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    } else if (hitHandle) {
      editorStore.beginGesture('Redimensionner la sélection')
      isResizing.value = true
      activeHandle.value = hitHandle
      dragStartPointer.value = { ...pos }
      dragStartBounds.value = { ...selectedBounds.value }
      dragStartScale.value = { x: currentScale.value, y: currentScale.value }

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    }

    // 2. Clic à l'intérieur de la boîte de sélection active (Déplacement uniquement si le pixel est opaque sur la sélection)
    const isOpaqueOnActiveSelection = (() => {
      if (isGroupTarget.value && activeSelectedGroup.value) {
        const groupLayers = activeLayers.value.filter((l) => l.groupId === activeSelectedGroup.value?.id)
        return groupLayers.some((layer) => {
          const img = getCachedAssetImage(layer.asset.blobId)
          return img ? isLayerPointOpaque(layer, pos, img) : false
        })
      }
      if (activeSelectedLayer.value) {
        const img = getCachedAssetImage(activeSelectedLayer.value.asset.blobId)
        return img ? isLayerPointOpaque(activeSelectedLayer.value, pos, img) : false
      }
      return false
    })()

    if (isOpaqueOnActiveSelection) {
      editorStore.beginGesture('Déplacer la sélection')
      isDragging.value = true
      dragStartPointer.value = { ...pos }

      if (isGroupTarget.value && activeSelectedGroup.value) {
        dragStartGroupPos.value = {
          x: activeSelectedGroup.value.transform.x,
          y: activeSelectedGroup.value.transform.y
        }
      } else if (activeSelectedLayer.value) {
        dragStartLayerPos.value = {
          x: activeSelectedLayer.value.localX ?? 0,
          y: activeSelectedLayer.value.localY ?? 0
        }
      }

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    }
  }

  // 3. Sélection au clic sur un calque
  const hit = hitTestLayer(pos)
  if (hit) {
    const hitGroup = editorStore.currentDocument.groups.find(
      (candidate) => candidate.id === hit.groupId
    )
    const selectWholeGroup =
      !isRigCalibrationOpen.value && shouldTargetWholeGroup(hitGroup?.kind)
    if (hit.groupId && selectWholeGroup) {
      editorStore.selectGroupForEditing(hit.groupId)
    } else if (isRigCalibrationOpen.value && hit.groupId === activeCalibrationGroup.value?.id) {
      editorStore.selectRigLayerForCalibration(hit.layerId)
    } else {
      editorStore.selectLayerForEditing(hit.layerId)
    }
    editorStore.beginGesture('Déplacer la sélection')
    assetStore.selectAsset(hit.asset.id)

    if (hit.locked) return

    isDragging.value = true
    dragStartPointer.value = { ...pos }

    if (selectWholeGroup && hit.groupId) {
      const group = editorStore.currentDocument.groups.find(
        (candidate) => candidate.id === hit.groupId
      )
      dragStartGroupPos.value = { x: group?.transform.x ?? 0, y: group?.transform.y ?? 0 }
    } else {
      dragStartLayerPos.value = { x: hit.localX ?? 0, y: hit.localY ?? 0 }
    }

    const target = e.currentTarget as HTMLElement
    target?.setPointerCapture?.(e.pointerId)
  } else {
    if (!editorStore.hasActiveGesture) editorStore.clearStudioSelection()
  }
}

function onCanvasPointerMove(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // A. Rotation
  if (isRotating.value && selectedBounds.value) {
    const centerX = selectedBounds.value.x + selectedBounds.value.width / 2
    const centerY = selectedBounds.value.y + selectedBounds.value.height / 2
    const currentAngle = Math.atan2(pos.y - centerY, pos.x - centerX)
    let deltaAngleDeg = ((currentAngle - dragStartAngleRad.value) * 180) / Math.PI
    let nextRot = Math.round(dragStartRotation.value + deltaAngleDeg)
    if (e.shiftKey) {
      nextRot = Math.round(nextRot / 15) * 15
    }
    while (nextRot > 180) nextRot -= 360
    while (nextRot < -180) nextRot += 360

    if (isGroupTarget.value && activeSelectedGroup.value) {
      editorStore.updateGroupTransform(activeSelectedGroup.value.id, { rotation: nextRot })
    } else if (activeSelectedLayer.value) {
      editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, { rotation: nextRot })
    }
    return
  }

  // B. Redimensionnement
  if (isResizing.value && activeHandle.value) {
    const scales = computeResizeScales(
      activeHandle.value,
      dragStartBounds.value,
      dragStartPointer.value,
      pos,
      dragStartScale.value.x,
      dragStartScale.value.y
    )
    applyUniformScale(scales.scaleX)
    return
  }

  // C. Déplacement (Translation)
  if (isDragging.value) {
    const dx = pos.x - dragStartPointer.value.x
    const dy = pos.y - dragStartPointer.value.y

    if (isGroupTarget.value && activeSelectedGroup.value) {
      const newGroupX = Math.round(dragStartGroupPos.value.x + dx)
      const newGroupY = Math.round(dragStartGroupPos.value.y + dy)
      editorStore.updateGroupTransform(activeSelectedGroup.value.id, { x: newGroupX, y: newGroupY })
    } else if (activeSelectedLayer.value) {
      if (activeSelectedLayer.value.category === 'background') {
        const clamped = clampBackgroundCover(
          {
            x: dragStartLayerPos.value.x + dx,
            y: dragStartLayerPos.value.y + dy,
            scaleX: currentScale.value,
            scaleY: currentScale.value
          },
          {
            assetWidth: activeSelectedLayer.value.asset.width || stage.value.width,
            assetHeight: activeSelectedLayer.value.asset.height || stage.value.height,
            stageWidth: stage.value.width,
            stageHeight: stage.value.height
          }
        )
        editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, {
          x: clamped.x,
          y: clamped.y
        })
      } else {
        const rigUnitScale =
          activeSelectedLayer.value.groupId === activeCalibrationGroup.value?.id &&
          activeSelectedLayer.value.asset.width > 0
            ? activeSelectedLayer.value.width / activeSelectedLayer.value.asset.width
            : 1
        const newX = Math.round(dragStartLayerPos.value.x + dx / rigUnitScale)
        const newY = Math.round(dragStartLayerPos.value.y + dy / rigUnitScale)
        editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, { x: newX, y: newY })
      }
    }
    return
  }

  // D. Survol
  if (selectedBounds.value) {
    hoveredHandle.value = hitTestResizeHandle(pos, selectedBounds.value)
  } else {
    hoveredHandle.value = null
  }
  hoveredLayer.value = hitTestLayer(pos)
}

function onCanvasPointerUp(e: PointerEvent) {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  activeHandle.value = null
  editorStore.endGesture()
  if (isRigCalibrationOpen.value && activeSelectedLayer.value) {
    void persistLayerCalibration(activeSelectedLayer.value)
  }

  const target = e.currentTarget as HTMLElement
  if (target?.hasPointerCapture?.(e.pointerId)) {
    target.releasePointerCapture(e.pointerId)
  }
}

function onCanvasDoubleClick(e: MouseEvent) {
  const pos = getStageCoordinates(e as unknown as PointerEvent)
  if (!pos) return

  const hit = hitTestLayer(pos)
  if (
    hit &&
    isActiveSelectionHit(
      {
        selectedLayerId: editorStore.selectedLayerId,
        selectedGroupId: editorStore.selectedGroupId,
        editScope: editorStore.editScope
      },
      hit
    )
  ) {
    editorStore.clearStudioSelection()
    assetStore.selectAsset(null)
    return
  }

  if (hit && hit.groupId) {
    const hitGroup = editorStore.currentDocument.groups.find(
      (candidate) => candidate.id === hit.groupId
    )
    if (isRigCalibrationOpen.value && hit.groupId === activeCalibrationGroup.value?.id) {
      editorStore.selectRigLayerForCalibration(hit.layerId)
    } else if (shouldTargetWholeGroup(hitGroup?.kind)) {
      editorStore.selectGroupForEditing(hit.groupId)
    } else {
      editorStore.selectLayerForEditing(hit.layerId)
    }
    assetStore.selectAsset(hit.asset.id)
  } else if (!hit && !editorStore.hasActiveGesture) {
    editorStore.clearStudioSelection()
    assetStore.selectAsset(null)
  }
}
</script>

<template>
  <div
    data-tour="stage"
    class="relative flex items-center justify-center w-full h-full overflow-hidden p-4 select-none"
    @pointerdown.self="editorStore.clearStudioSelection()"
  >
    <div
      ref="stageViewport"
      class="relative shadow-glass-2xl rounded-xl overflow-hidden border transition-all duration-200 bg-black/90 border-border-subtle/80 ring-1 ring-white/5"
      :class="resizeCursorClass"
      :style="{
        aspectRatio: `${stage.width} / ${stage.height}`,
        maxHeight: '100%',
        maxWidth: '100%'
      }"
      @pointerdown="onCanvasPointerDown"
      @pointermove="onCanvasPointerMove"
      @pointerup="onCanvasPointerUp"
      @pointercancel="onCanvasPointerUp"
      @pointerleave="onCanvasPointerUp"
      @dblclick="onCanvasDoubleClick"
    >
      <canvas
        ref="canvas"
        :width="stage.width"
        :height="stage.height"
        class="w-full h-full object-contain block pointer-events-none"
      />

      <CameraFrameOverlay
        v-if="activeCamera.enabled"
        v-model="activeCamera"
        :stage-width="stage.width"
        :stage-height="stage.height"
        @commit="commitCameraFrame"
      />

      <DepthOfFieldOverlay
        v-if="depthOfField.enabled && isDepthOfFieldEditorOpen && !activeCamera.enabled"
        :model-value="depthOfField"
        :stage-height="stage.height"
        @interaction-start="beginDepthOfFieldInteraction"
        @update:model-value="scheduleDepthOfFieldUpdate"
        @commit="commitDepthOfFieldUpdate"
      />

      <div
        class="viewport-glass absolute top-3 right-3 z-40 flex items-center gap-1 rounded-xl border p-1 transition-all duration-300 ease-out"
        @pointerdown.stop
        @dblclick.stop
      >
        <Badge
          variant="neutral"
          size="sm"
          class="mx-1 border-white/15 bg-black/30 font-mono text-[10px] text-white/90"
        >
          {{ stage.width }} × {{ stage.height }}
        </Badge>
        <IconButton
          icon="construction"
          size="xs"
          variant="ghost"
          class="viewport-action"
          :active="isRigCalibrationOpen"
          aria-label="Calibrer les sprites du rig"
          title="Calibrer les sprites du rig"
          @click="toggleRigCalibration"
        />
        <IconButton
          icon="blur_on"
          size="xs"
          variant="ghost"
          class="viewport-action"
          :active="depthOfField.enabled"
          :aria-label="
            depthOfField.enabled
              ? 'Désactiver le flou de profondeur'
              : 'Activer le flou de profondeur'
          "
          :title="
            depthOfField.enabled
              ? 'Désactiver le flou de profondeur'
              : 'Activer le flou de profondeur'
          "
          @click="toggleDepthOfField"
        />
        <IconButton
          icon="tune"
          size="xs"
          variant="ghost"
          class="viewport-action"
          :active="isDepthOfFieldEditorOpen"
          :disabled="!depthOfField.enabled"
          :aria-label="
            isDepthOfFieldEditorOpen
              ? 'Masquer les réglages de profondeur de champ'
              : 'Afficher les réglages de profondeur de champ'
          "
          :title="isDepthOfFieldEditorOpen ? 'Masquer les réglages' : 'Afficher les réglages'"
          @click="toggleDepthOfFieldEditor"
        />
        <IconButton
          icon="crop_free"
          size="xs"
          variant="ghost"
          class="viewport-action"
          :active="activeCamera.enabled"
          :aria-label="
            activeCamera.enabled ? 'Désactiver le cadrage caméra' : 'Activer le cadrage caméra'
          "
          :title="activeCamera.enabled ? 'Désactiver le cadrage' : 'Activer le cadrage caméra'"
          @click="toggleCameraFrame"
        />
        <IconButton
          icon="undo"
          size="xs"
          variant="ghost"
          class="viewport-action"
          aria-label="Annuler la dernière transformation"
          aria-keyshortcuts="Control+Z Meta+Z"
          title="Annuler (Ctrl/Cmd+Z)"
          :disabled="!editorStore.canUndo || isDragging || isResizing"
          @click="undoCanvasTransform"
        />
        <IconButton
          icon="redo"
          size="xs"
          variant="ghost"
          class="viewport-action"
          aria-label="Rétablir la dernière transformation"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          title="Rétablir (Ctrl/Cmd+Shift+Z ou Ctrl+Y)"
          :disabled="!editorStore.canRedo || isDragging || isResizing"
          @click="redoCanvasTransform"
        />
      </div>

      <section
        v-if="canEditSelectedOpticalDepth && isOpticalDepthEditorOpen"
        :id="`${opticalDepthPanelTitleId}-panel`"
        ref="opticalDepthPanel"
        class="viewport-glass absolute z-50 flex w-80 max-w-[calc(100%-1rem)] flex-col overflow-hidden rounded-2xl border text-white/90 shadow-glass-xl animate-in fade-in zoom-in-95 duration-200"
        :class="!opticalDepthFloating.isDragging.value && 'transition-all duration-300 ease-out'"
        :style="opticalDepthFloating.style.value"
        role="region"
        :aria-labelledby="opticalDepthPanelTitleId"
        @pointerdown.stop
        @dblclick.stop
      >
        <header
          class="flex items-center gap-2 border-b border-white/15 bg-black/15 px-3 py-2.5"
        >
          <IconButton
            icon="drag_indicator"
            size="xs"
            variant="ghost"
            class="viewport-action shrink-0 touch-none"
            :class="opticalDepthFloating.isDragging.value ? 'cursor-grabbing' : 'cursor-grab'"
            aria-label="Déplacer le panneau Distance caméra"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            title="Déplacer le panneau"
            @pointerdown="opticalDepthFloating.beginDrag"
            @pointermove="opticalDepthFloating.moveDrag"
            @pointerup="opticalDepthFloating.endDrag"
            @pointercancel="opticalDepthFloating.endDrag"
            @keydown="opticalDepthFloating.nudge"
          />
          <div class="min-w-0 flex-1">
            <Heading
              :id="opticalDepthPanelTitleId"
              as="h3"
              variant="sm"
              class="text-xs font-semibold text-white"
            >
              Distance caméra
            </Heading>
            <Text
              as="p"
              variant="caption"
              class="mt-0.5 text-[10px] leading-snug text-white/60"
            >
              Affecte le flou, jamais l’ordre des calques.
            </Text>
          </div>
          <IconButton
            icon="close"
            size="xs"
            variant="ghost"
            class="viewport-action shrink-0"
            aria-label="Fermer les réglages de distance caméra"
            title="Fermer"
            @click="toggleOpticalDepthEditor"
          />
        </header>

        <div class="flex flex-col gap-4 p-3">
          <SegmentedControl
            v-model="selectedOpticalPreset"
            :options="opticalDepthPresetOptions"
            size="sm"
            variant="primary"
            class="w-full justify-center"
            aria-label="Préréglage de distance caméra"
          />

          <div
            @pointerdown.capture="beginOpticalDepthInteraction"
            @pointerup.capture="finishOpticalDepthInteraction"
            @pointercancel.capture="finishOpticalDepthInteraction"
            @keydown.capture="beginOpticalDepthKeyboard"
            @keyup.capture="finishOpticalDepthInteraction"
          >
            <Slider
              :model-value="selectedOpticalDepthPercent"
              :min="0"
              :max="100"
              :step="5"
              size="sm"
              variant="gradient"
              label="Ajustement fin"
              show-value
              show-ticks
              :ticks="[
                { value: 0, label: 'Loin' },
                { value: 50, label: 'Net' },
                { value: 100, label: 'Proche' }
              ]"
              :formatter="(value) => `${value} %`"
              @update:model-value="scheduleOpticalDepthUpdate"
            />
          </div>

          <div class="flex items-center justify-between gap-3 text-[11px]">
            <span class="text-white/60">
              {{ selectedOpticalDepthLabel }} · {{ selectedOpticalDepthPercent }} %
            </span>
            <Button size="xs" variant="ghost" @click="resetSelectedOpticalDepth"> Auto </Button>
          </div>
        </div>
      </section>

      <!-- HUD contextuel d'Édition Directe (Bannière Inférieure) -->
      <div
        v-if="activeSelectedLayer && !isRigCalibrationOpen"
        ref="viewportHud"
        class="absolute z-40 flex max-w-[calc(100%-1rem)] items-center gap-2 pointer-events-auto animate-in fade-in duration-200"
        :class="!viewportHudFloating.isDragging.value && 'transition-all duration-300 ease-out'"
        :style="viewportHudFloating.style.value"
        @pointerdown.stop
      >
        <div
          class="viewport-glass flex items-center gap-2 rounded-xl border px-2 py-1.5 text-xs"
        >
          <IconButton
            icon="drag_indicator"
            size="xs"
            variant="ghost"
            class="viewport-action shrink-0 touch-none"
            :class="viewportHudFloating.isDragging.value ? 'cursor-grabbing' : 'cursor-grab'"
            aria-label="Déplacer la barre d’outils du calque"
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            title="Déplacer la barre"
            @pointerdown="viewportHudFloating.beginDrag"
            @pointermove="viewportHudFloating.moveDrag"
            @pointerup="viewportHudFloating.endDrag"
            @pointercancel="viewportHudFloating.endDrag"
            @keydown="viewportHudFloating.nudge"
          />

          <!-- Nom & Icône du calque sélectionné -->
          <span class="flex items-center gap-1.5 font-semibold text-white/90">
            <Icon
              :name="ASSET_CATEGORIES[activeSelectedLayer.category]?.icon || 'layers'"
              size="xs"
              class="text-primary"
            />
            <span>{{
              isGroupTarget && activeSelectedGroup
                ? activeSelectedGroup.name
                : activeSelectedLayer.name || activeSelectedLayer.asset.name
            }}</span>
          </span>

          <div
            v-if="canEditSelectedDeskPlacement"
            class="flex items-center gap-2 border-l border-white/15 pl-2"
          >
            <span class="text-[10px] font-semibold text-white/60">Scène</span>
            <SegmentedControl
              v-model="selectedDeskPlacement"
              :options="deskPlacementOptions"
              size="sm"
              variant="primary"
              class="bg-bg-surface/30"
              aria-label="Position de l’accessoire par rapport au bureau et aux personnages"
            />
          </div>

          <IconButton
            v-if="canEditSelectedOpticalDepth"
            icon="tune"
            size="xs"
            variant="ghost"
            class="viewport-action"
            :active="isOpticalDepthEditorOpen"
            :aria-label="
              isOpticalDepthEditorOpen
                ? 'Fermer les réglages de distance caméra'
                : 'Régler la distance caméra du calque'
            "
            :title="isOpticalDepthEditorOpen ? 'Fermer Distance caméra' : 'Distance caméra'"
            @click="toggleOpticalDepthEditor"
          />

          <IconButton
            icon="flip"
            size="xs"
            variant="ghost"
            class="viewport-action"
            :active="isSelectedFlippedHorizontally"
            :aria-label="
              isSelectedFlippedHorizontally
                ? 'Rétablir l’orientation normale'
                : 'Retourner horizontalement'
            "
            :title="
              isSelectedFlippedHorizontally
                ? 'Rétablir l’orientation normale'
                : 'Retourner horizontalement'
            "
            @click="flipSelectedHorizontal"
          />

          <IconButton
            icon="delete"
            size="xs"
            variant="destructive"
            :aria-label="deleteSelectionLabel"
            :title="deleteSelectionLabel"
            @click="removeSelectedFromViewport"
          />

          <!-- Bouton Désélectionner / Fermer HUD -->
          <IconButton
            icon="close"
            size="xs"
            variant="ghost"
            class="viewport-action size-5 p-0"
            title="Désélectionner"
            @click="editorStore.clearStudioSelection()"
          />
        </div>
      </div>
    </div>
  </div>
</template>
