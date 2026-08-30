<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted, watch } from 'vue'
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
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Popover } from '@/components/ui/popover'
import { CameraFrameOverlay } from '@/components/ui/camera-frame-overlay'
import {
  DepthOfFieldOverlay,
  type DepthOfFieldOverlayValue
} from '@/components/ui/depth-of-field-overlay'
import { DeskSplitModal } from '@/components/ui/desk-split-modal'
import type { CameraFrame, CharacterGroup, ColorGradingSettings, ShaderSettings } from '@core/types/editor.types'
import type { DeskSplitConfig } from '@core/types/asset.types'
import type { TourKey } from '@/features/project/services/tour-definitions'
import { OPTICAL_DEPTH_PRESETS } from '@core/constants/editor'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { useRigRuntime } from '../rig-calibration/useRigRuntime'
import StudioGlobalToolbar from './StudioGlobalToolbar.vue'

const { isSavedSnapshotsOpen = false } = defineProps<{
  isSavedSnapshotsOpen?: boolean
}>()

const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'openExport'): void
  (event: 'toggleSavedSnapshots'): void
  (event: 'startTour', key?: TourKey): void
}>()

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const assetStore = useAssetStore()
const rigCatalog = useRigCatalogStore()
const rigRuntime = useRigRuntime()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()
const isRigCalibrationOpen = computed(() => rigCatalog.isCalibrationOpen)

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

const isOpticalDepthEditorOpen = ref(false)
const isSelectionToolsOpen = computed(() => Boolean(activeSelectedLayer.value))
let visualEffectsFrame: number | null = null
let pendingColorGrading: ColorGradingSettings | null = null
let pendingShaderSettings: ShaderSettings | null = null

function flushVisualEffectsUpdate(): void {
  visualEffectsFrame = null
  if (pendingColorGrading) {
    editorStore.updateColorGrading(pendingColorGrading)
    pendingColorGrading = null
  }
  if (pendingShaderSettings) {
    editorStore.updateShaderSettings(pendingShaderSettings)
    pendingShaderSettings = null
  }
}

function scheduleVisualEffectsUpdate(): void {
  if (visualEffectsFrame !== null) return
  visualEffectsFrame = window.requestAnimationFrame(flushVisualEffectsUpdate)
}

const colorGrading = computed(() => editorStore.currentDocument.colorGrading)
const colorGradingModel = computed<ColorGradingSettings>({
  get: () => editorStore.currentDocument.colorGrading,
  set: (settings) => {
    pendingColorGrading = settings
    scheduleVisualEffectsUpdate()
  }
})

const shaderSettings = computed(() => editorStore.currentDocument.shaderSettings)
const shaderModel = computed<ShaderSettings>({
  get: () => editorStore.currentDocument.shaderSettings,
  set: (settings) => {
    pendingShaderSettings = settings
    scheduleVisualEffectsUpdate()
  }
})

const hasVisualEffects = computed(() => colorGrading.value.enabled || shaderSettings.value.enabled)

function beginVisualEffectsInteraction(label: string): void {
  editorStore.beginGesture(label)
}

function endVisualEffectsInteraction(): void {
  if (visualEffectsFrame !== null) window.cancelAnimationFrame(visualEffectsFrame)
  flushVisualEffectsUpdate()
  editorStore.endGesture()
}

function resetVisualEffects(): void {
  if (visualEffectsFrame !== null) window.cancelAnimationFrame(visualEffectsFrame)
  pendingColorGrading = null
  pendingShaderSettings = null
  visualEffectsFrame = null
  editorStore.endGesture()
  editorStore.resetVisualEffects()
}

let depthOfFieldFrame: number | null = null
let pendingDepthOfField: DepthOfFieldOverlayValue | null = null
let hasDepthOfFieldGesture = false
let opticalDepthFrame: number | null = null
let pendingOpticalDepth: { targetType: 'layer' | 'group'; targetId: string; value: number } | null =
  null
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
  () =>
    (editScope.value === 'layer' && editorStore.selectedLayer?.category === 'props_set') ||
    (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character')
)

const isDeskSplitModalOpen = ref(false)

const selectedDeskAsset = computed(() => {
  if (activeSelectedLayer.value?.category === 'desk') {
    return activeSelectedLayer.value.asset
  }
  if (editorStore.selectedLayer?.category === 'desk') {
    const assetId = editorStore.selectedLayer.assetId
    return assetStore.assets.find((a) => a.id === assetId) ?? null
  }
  return null
})

async function handleSaveDeskSplit(config: DeskSplitConfig) {
  if (!selectedDeskAsset.value) return
  await assetStore.updateAsset(selectedDeskAsset.value.id, { deskSplit: config })
  toast.success('Découpe 2.5D enregistrée', 'La profondeur du meuble a été mise à jour.')
}

const selectedDeskPlacement = computed<string>({
  get: () => {
    if (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character') {
      return activeSelectedGroup.value.zIndex <= deskReferenceZIndex.value ? 'behind' : 'front'
    }
    return (editorStore.selectedLayer?.zIndex ?? ASSET_CATEGORIES.props_set.defaultZIndex) <=
      stagePlacementZIndexes.value.behind
      ? 'behind'
      : 'front'
  },
  set: (value) => {
    if (value !== 'behind' && value !== 'front') return
    if (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character') {
      editorStore.updateGroup(
        activeSelectedGroup.value.id,
        {
          zIndex:
            value === 'behind'
              ? stagePlacementZIndexes.value.behind
              : stagePlacementZIndexes.value.front
        },
        value === 'behind'
          ? 'Placer le personnage derrière le bureau'
          : 'Placer le personnage devant le bureau'
      )
      return
    }
    const layer = editorStore.selectedLayer
    if (!layer) return
    editorStore.updateLayerZIndex(layer.id, stagePlacementZIndexes.value[value])
  }
})

const canEditSelectedOpticalDepth = computed(() => {
  if (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character') return true
  const category = activeSelectedLayer.value?.category ?? editorStore.selectedLayer?.category
  if (!category) return false
  return category !== 'background'
})

function resolvedSelectedOpticalDepth(): number {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    const group = activeSelectedGroup.value
    if (Number.isFinite(group.opticalDepth)) {
      return Math.max(0, Math.min(1, group.opticalDepth!))
    }
    const primaryLayer = editorStore.currentDocument.layers.find(
      (l) => l.groupId === group.id && !l.muted
    )
    if (primaryLayer && Number.isFinite(primaryLayer.opticalDepth)) {
      return Math.max(0, Math.min(1, primaryLayer.opticalDepth!))
    }
    return group.depthRole === 'background'
      ? OPTICAL_DEPTH_PRESETS.far
      : OPTICAL_DEPTH_PRESETS.focus
  }

  const layer = activeSelectedLayer.value ?? editorStore.selectedLayer
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
    if (isGroupTarget.value && activeSelectedGroup.value) {
      const group = activeSelectedGroup.value
      if (preset === 'far') editorStore.setGroupDepthRole(group.id, 'background')
      else if (preset === 'focus') editorStore.setGroupDepthRole(group.id, 'subject')
      else if (preset === 'near') {
        editorStore.setGroupOpticalDepth(group.id, OPTICAL_DEPTH_PRESETS.near)
      }
      return
    }

    const layer = activeSelectedLayer.value ?? editorStore.selectedLayer
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
  if (pending) {
    if (pending.targetType === 'group') {
      editorStore.setGroupOpticalDepth(pending.targetId, pending.value)
    } else {
      editorStore.setLayerOpticalDepth(pending.targetId, pending.value)
    }
  }
}

function scheduleOpticalDepthUpdate(value: number | number[]) {
  const normValue = Math.max(0, Math.min(100, scalarValue(value))) / 100
  if (isGroupTarget.value && activeSelectedGroup.value) {
    pendingOpticalDepth = {
      targetType: 'group',
      targetId: activeSelectedGroup.value.id,
      value: normValue
    }
  } else {
    const layer = activeSelectedLayer.value ?? editorStore.selectedLayer
    if (!layer) return
    pendingOpticalDepth = {
      targetType: 'layer',
      targetId: layer.id,
      value: normValue
    }
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
  if (isGroupTarget.value && activeSelectedGroup.value) {
    editorStore.setGroupDepthRole(activeSelectedGroup.value.id, 'auto')
    return
  }
  const layer = activeSelectedLayer.value ?? editorStore.selectedLayer
  if (!layer) return
  editorStore.setLayerDepthRole(layer.id, 'auto')
}

watch([selectedLayerId, () => editorStore.selectedGroupId], () => {
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

function finishDepthOfFieldInteraction(): void {
  flushDepthOfFieldUpdate()
  if (hasDepthOfFieldGesture) {
    hasDepthOfFieldGesture = false
    editorStore.endGesture()
  }
}

function updateDofBlurRadius(value: number | number[]): void {
  const blurRadius = Array.isArray(value) ? (value[0] ?? 0) : value
  scheduleDepthOfFieldUpdate({ ...depthOfField.value, blurRadius })
}

function updateDofFeather(value: number | number[]): void {
  const feather = Array.isArray(value) ? (value[0] ?? 0) : value
  scheduleDepthOfFieldUpdate({ ...depthOfField.value, feather })
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
  depthOfField,
  colorGrading,
  shaderSettings,
  activeCamera
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
  if (visualEffectsFrame !== null) window.cancelAnimationFrame(visualEffectsFrame)
  flushVisualEffectsUpdate()
  editorStore.endGesture()
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
    data-tour="stage-canvas"
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
        v-if="depthOfField.enabled && !activeCamera.enabled"
        :model-value="depthOfField"
        :show-controls="false"
        :stage-height="stage.height"
        @interaction-start="beginDepthOfFieldInteraction"
        @update:model-value="scheduleDepthOfFieldUpdate"
        @commit="commitDepthOfFieldUpdate"
      />

      <!-- Barre d'outils globale (Fixe, haut centré avec popovers ancrés) -->
      <StudioGlobalToolbar
        v-model:color-grading="colorGradingModel"
        v-model:shader-settings="shaderModel"
        :stage="stage"
        :active-camera="activeCamera"
        :depth-of-field="depthOfField"
        :has-visual-effects="hasVisualEffects"
        :is-saved-snapshots-open="isSavedSnapshotsOpen"
        :is-rig-calibration-open="isRigCalibrationOpen"
        :can-undo="Boolean(editorStore.canUndo && !isDragging && !isResizing)"
        :can-redo="Boolean(editorStore.canRedo && !isDragging && !isResizing)"
        @open-settings="emit('openSettings')"
        @open-export="emit('openExport')"
        @toggle-saved-snapshots="emit('toggleSavedSnapshots')"
        @toggle-depth-of-field="toggleDepthOfField"
        @update-dof-blur-radius="updateDofBlurRadius"
        @update-dof-feather="updateDofFeather"
        @begin-depth-interaction="beginDepthOfFieldInteraction"
        @finish-depth-interaction="finishDepthOfFieldInteraction"
        @toggle-camera-frame="toggleCameraFrame"
        @toggle-rig-calibration="toggleRigCalibration"
        @undo="undoCanvasTransform"
        @redo="redoCanvasTransform"
        @start-tour="(key) => emit('startTour', key)"
        @interaction-start="beginVisualEffectsInteraction"
        @interaction-end="endVisualEffectsInteraction"
        @reset-visual-effects="resetVisualEffects"
      />

      <!-- HUD contextuel d'Édition Directe (Bannière Inférieure Fixe, bas centré avec Popovers ancrés au-dessus) -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <div
          v-if="isSelectionToolsOpen && !isRigCalibrationOpen"
          class="viewport-glass absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-2xl border border-white/15 px-3 py-1.5 text-white/90 shadow-glass-xl pointer-events-auto select-none max-w-[calc(100%-1.5rem)] text-xs"
          data-tour="selection-tools"
          role="toolbar"
          aria-label="Outils du calque sélectionné"
          @pointerdown.stop
          @dblclick.stop
        >
          <!-- Nom & Icône du calque sélectionné -->
          <span class="flex items-center gap-1.5 font-semibold text-white/90 pr-2 border-r border-white/15">
            <Icon
              :name="
                activeSelectedLayer
                  ? ASSET_CATEGORIES[activeSelectedLayer.category]?.icon || 'layers'
                  : 'layers'
              "
              size="xs"
              class="text-primary"
            />
            <span class="truncate max-w-[150px]">{{
              isGroupTarget && activeSelectedGroup
                ? activeSelectedGroup.name
                : activeSelectedLayer?.name || activeSelectedLayer?.asset.name
            }}</span>
          </span>

          <!-- Position Bureau / Scène -->
          <div
            v-if="canEditSelectedDeskPlacement"
            class="flex items-center gap-1.5 pr-2 border-r border-white/15"
          >
            <span class="text-[10px] font-semibold text-white/60">Scène</span>
            <SegmentedControl
              v-model="selectedDeskPlacement"
              :options="deskPlacementOptions"
              size="sm"
              variant="primary"
              class="bg-black/30 border border-white/10"
              aria-label="Position de l’accessoire par rapport au bureau et aux personnages"
            />
          </div>

          <!-- Distance Caméra (Flou Optique du calque) avec Popover side="top" -->
          <Popover
            v-if="canEditSelectedOpticalDepth"
            v-model="isOpticalDepthEditorOpen"
            side="top"
            align="center"
            surface="glass"
            width="md"
            :side-offset="10"
          >
            <template #trigger>
              <IconButton
                icon="tune"
                size="xs"
                variant="ghost"
                class="viewport-action size-7"
                :active="isOpticalDepthEditorOpen"
                aria-label="Régler la distance caméra du calque"
                title="Distance caméra (flou optique du calque)"
              />
            </template>

            <div class="p-3 text-white/90 space-y-3" data-optical-depth-controls>
              <div class="flex items-center justify-between border-b border-white/10 pb-2">
                <div class="flex items-center gap-1.5">
                  <Icon name="tune" size="xs" class="text-primary" />
                  <span class="text-xs font-semibold text-white">Distance caméra</span>
                </div>
                <span class="text-[10px] text-white/50">Affecte le flou, jamais l’ordre Z</span>
              </div>

              <SegmentedControl
                v-model="selectedOpticalPreset"
                :options="opticalDepthPresetOptions"
                size="sm"
                variant="primary"
                class="w-full justify-center bg-black/30 border border-white/10"
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

              <div class="flex items-center justify-between gap-3 text-[11px] pt-1 border-t border-white/10">
                <span class="text-white/60">
                  {{ selectedOpticalDepthLabel }} · {{ selectedOpticalDepthPercent }} %
                </span>
                <Button size="xs" variant="ghost" class="h-6 text-white/80 hover:text-white" @click="resetSelectedOpticalDepth">
                  Auto
                </Button>
              </div>
            </div>
          </Popover>

          <!-- Découpe 2.5D pour les bureaux -->
          <IconButton
            v-if="selectedDeskAsset"
            icon="content_cut"
            size="xs"
            variant="ghost"
            class="viewport-action size-7 text-amber-400 hover:text-amber-300"
            :active="isDeskSplitModalOpen"
            aria-label="Découper la profondeur du meuble (2.5D)"
            title="Découper la profondeur du meuble (2.5D)"
            @click="isDeskSplitModalOpen = true"
          />

          <!-- Miroir Horizontal -->
          <IconButton
            icon="flip"
            size="xs"
            variant="ghost"
            class="viewport-action size-7"
            :active="isSelectedFlippedHorizontally"
            :aria-label="isSelectedFlippedHorizontally ? 'Rétablir l’orientation' : 'Retourner horizontalement'"
            :title="isSelectedFlippedHorizontally ? 'Rétablir l’orientation' : 'Retourner horizontalement'"
            @click="flipSelectedHorizontal"
          />

          <!-- Supprimer -->
          <IconButton
            icon="delete"
            size="xs"
            variant="destructive"
            class="size-7"
            :aria-label="deleteSelectionLabel"
            :title="deleteSelectionLabel"
            @click="removeSelectedFromViewport"
          />

          <!-- Désélectionner / Fermer -->
          <IconButton
            icon="close"
            size="xs"
            variant="ghost"
            class="viewport-action size-7 text-white/50 hover:text-white"
            title="Désélectionner"
            @click="editorStore.clearStudioSelection()"
          />
        </div>
      </Transition>
    </div>

    <!-- Modale de calibrage de découpe 2.5D du bureau -->
    <DeskSplitModal
      v-if="selectedDeskAsset"
      v-model="isDeskSplitModalOpen"
      :asset="selectedDeskAsset"
      @save="handleSaveDeskSplit"
    />
  </div>
</template>
