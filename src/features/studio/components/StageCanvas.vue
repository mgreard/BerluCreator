<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted, watch } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver } from '../composables/useHierarchyResolver'
import type { RenderableLayer } from '../rendering'
import { getCachedAssetImage, useCanvasRenderer } from '../composables/useCanvasRenderer'
import { isLayerPointOpaque } from '../engine/alpha-hit-test'
import { isActiveSelectionHit, shouldTargetWholeGroup } from '../engine/selection-target'
import { computeBackgroundCoverTransform } from '../engine/background-cover.engine'
import { resolveStagePlacementZIndexes } from '../engine/stage-layer-placement'
import {
  panViewport,
  zoomViewportAt,
  type ViewportNavigation
} from '../engine/viewport-navigation'
import {
  computeResizeScales,
  computeTransformedBounds,
  type BoxBounds,
  type ResizeHandle
} from '../engine/transform-matrix'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { CameraFrameOverlay } from '../camera-frame'
import {
  DepthOfFieldOverlay,
  DepthOfFieldControls,
  type DepthOfFieldOverlayValue
} from '../depth-of-field'
import { VisualEffectsControls } from '../visual-effects'
import { DeskSplitModal } from '@/features/desk-split'
import type {
  CameraFrame,
  CharacterGroup,
  ColorGradingSettings,
  LayerDepthRole,
  ShaderSettings
} from '@core/types/editor.types'
import type { Asset, DeskSplitConfig } from '@core/types/asset.types'
import type { TourKey } from '@/features/project/services/tour-definitions'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import StudioGlobalToolbar from './StudioGlobalToolbar.vue'
import { StudioSelectionToolbar, type DeskPlacement } from './studio-selection-toolbar'
import { ViewportQuicksaveButton } from './viewport-quicksave-button'
import { ViewportQuickExportButton } from './viewport-quick-export-button'

const { isSavedSnapshotsOpen = false } = defineProps<{
  isSavedSnapshotsOpen?: boolean
}>()

const emit = defineEmits<{
  (event: 'openExport'): void
  (event: 'toggleSavedSnapshots'): void
  (event: 'startTour', key?: TourKey): void
}>()

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const assetStore = useAssetStore()
const rigCatalog = useRigCatalogStore()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const stageViewportRef = useTemplateRef<HTMLDivElement>('stageViewport')
const quicksaveBtnRef = useTemplateRef<InstanceType<typeof ViewportQuicksaveButton>>('quicksaveBtn')
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

function focusRigInAssetLibrary(group: CharacterGroup): void {
  assetStore.focusCharacterInLibrary(group.characterKey)
}

function focusPropInAssetLibrary(layer: RenderableLayer, group?: CharacterGroup): void {
  if (layer.category === 'props_character' && group) {
    assetStore.focusCharacterInLibrary(group.characterKey, {
      assetId: layer.asset.id,
      categoryId: 'props-character'
    })
    return
  }
  assetStore.focusStageAssetInLibrary(layer.asset.id, layer.category)
}

function isPropLayer(layer: RenderableLayer): boolean {
  return ['props_character', 'props_desk', 'props_set'].includes(layer.category)
}

function closeRigCalibration(): void {
  rigCatalog.closeCalibration()
  const group = activeCalibrationGroup.value
  if (group) editorStore.selectGroupForEditing(group.id)
}

async function persistLayerCalibration(layer: RenderableLayer): Promise<void> {
  void layer
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

type StudioInspectorId = 'visual-effects'
const activeStudioPanel = ref<StudioInspectorId | null>(null)

function panelOpenModel(panelId: StudioInspectorId) {
  return computed({
    get: () => activeStudioPanel.value === panelId,
    set: (open: boolean) => {
      if (open) activeStudioPanel.value = panelId
      else if (activeStudioPanel.value === panelId) activeStudioPanel.value = null
    }
  })
}

const isVisualEffectsEditorOpen = panelOpenModel('visual-effects')
const isDepthOfFieldEditorOpen = ref(false)
const isSelectionToolsOpen = computed(
  () =>
    Boolean(activeSelectedLayer.value) &&
    !isDepthOfFieldEditorOpen.value &&
    activeStudioPanel.value === null
)
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

function setVisualEffectsEditorOpen(open: boolean): void {
  if (!open && isVisualEffectsEditorOpen.value) endVisualEffectsInteraction()
  isVisualEffectsEditorOpen.value = open
}

function setDepthOfFieldEditorOpen(open: boolean): void {
  if (open && !depthOfField.value.enabled) {
    editorStore.updateDepthOfField({ ...depthOfField.value, enabled: true })
  }
  if (open) activeStudioPanel.value = null
  isDepthOfFieldEditorOpen.value = open
}

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

const showSelection = computed(() => !activeCamera.value.enabled)

const canEditSelectedDeskPlacement = computed(
  () =>
    (editScope.value === 'layer' && editorStore.selectedLayer?.category === 'props_set') ||
    (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character')
)

const isDeskSplitModalOpen = ref(false)
const deskSplitAsset = ref<Asset | null>(null)

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

watch(isDeskSplitModalOpen, (open) => {
  if (!open) deskSplitAsset.value = null
})

function openDeskSplitEditor() {
  const asset = selectedDeskAsset.value
  if (!asset) return
  deskSplitAsset.value = asset
  isDeskSplitModalOpen.value = true
}

async function handleSaveDeskSplit(config: DeskSplitConfig) {
  if (!deskSplitAsset.value) return
  await assetStore.updateAsset(deskSplitAsset.value.id, { deskSplit: config })
  toast.success('Découpe 2.5D enregistrée', 'La profondeur du meuble a été mise à jour.')
}

const selectedDeskPlacement = computed<DeskPlacement>({
  get: () => {
    if (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character') {
      return activeSelectedGroup.value.stagePlane === 'front' ? 'front' : 'behind'
    }
    return editorStore.selectedLayer?.stagePlane === 'rear' ? 'behind' : 'front'
  },
  set: (value) => {
    if (value !== 'behind' && value !== 'front') return
    if (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character') {
      editorStore.updateGroup(
        activeSelectedGroup.value.id,
        { stagePlane: value === 'behind' ? 'rear' : 'front' },
        value === 'behind'
          ? 'Placer le personnage derrière le bureau'
          : 'Placer le personnage devant le bureau'
      )
      return
    }
    const layer = editorStore.selectedLayer
    if (!layer) return
    const deskZIndex =
      editorStore.currentDocument.layers.find((candidate) => candidate.category === 'desk')
        ?.zIndex ?? ASSET_CATEGORIES.desk.defaultZIndex
    const placementZIndexes = resolveStagePlacementZIndexes(
      deskZIndex,
      editorStore.currentDocument.groups
    )
    editorStore.updateLayer(
      layer.id,
      {
        stagePlane: value === 'behind' ? 'rear' : 'front',
        zIndex: placementZIndexes[value]
      },
      value === 'behind'
        ? 'Placer l’accessoire derrière les personnages et le bureau'
        : 'Placer l’accessoire devant les personnages et le bureau'
    )
  }
})

const selectedBlurEnabled = computed<boolean>({
  get: () => {
    if (isGroupTarget.value && activeSelectedGroup.value) {
      return activeSelectedGroup.value.depthRole === 'background'
    }
    if (editorStore.selectedLayer) {
      return editorStore.selectedLayer.depthRole === 'background'
    }
    return false
  },
  set: (enabled: boolean) => {
    const role: LayerDepthRole = enabled ? 'background' : 'subject'
    if (isGroupTarget.value && activeSelectedGroup.value) {
      editorStore.setGroupDepthRole(activeSelectedGroup.value.id, role)
      return
    }
    const layer = editorStore.selectedLayer
    if (layer) {
      editorStore.setLayerDepthRole(layer.id, role)
    }
  }
})

function toggleSelectedBlur(): void {
  selectedBlurEnabled.value = !selectedBlurEnabled.value
}

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
const viewportNavigation = ref<ViewportNavigation>({ zoom: 1, panX: 0, panY: 0 })
const viewportPanGesture = ref<{
  pointerId: number
  startX: number
  startY: number
  navigation: ViewportNavigation
} | null>(null)

const viewportTransformStyle = computed(() => ({
  transform: `translate3d(${viewportNavigation.value.panX}px, ${viewportNavigation.value.panY}px, 0) scale(${viewportNavigation.value.zoom})`,
  transformOrigin: 'center center'
}))

function viewportSize(): { width: number; height: number } | null {
  const viewport = stageViewportRef.value
  if (!viewport?.offsetWidth || !viewport.offsetHeight) return null
  return { width: viewport.offsetWidth, height: viewport.offsetHeight }
}

function onViewportWheel(event: WheelEvent): void {
  if (!activeCamera.value.enabled || event.deltaY === 0) return
  const viewport = stageViewportRef.value
  const size = viewportSize()
  if (!viewport || !size) return
  const rect = viewport.getBoundingClientRect()
  event.preventDefault()
  viewportNavigation.value = zoomViewportAt(
    viewportNavigation.value,
    event.deltaY,
    {
      x: event.clientX - (rect.left + rect.width / 2),
      y: event.clientY - (rect.top + rect.height / 2)
    },
    size
  )
}

function beginViewportPan(event: PointerEvent): boolean {
  if (!activeCamera.value.enabled || viewportNavigation.value.zoom <= 1 || event.button !== 1) {
    return false
  }
  event.preventDefault()
  event.stopPropagation()
  stageViewportRef.value?.setPointerCapture(event.pointerId)
  viewportPanGesture.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    navigation: { ...viewportNavigation.value }
  }
  return true
}

function updateViewportPan(event: PointerEvent): boolean {
  const gesture = viewportPanGesture.value
  const size = viewportSize()
  if (!gesture || gesture.pointerId !== event.pointerId || !size) return false
  event.preventDefault()
  viewportNavigation.value = panViewport(
    gesture.navigation,
    event.clientX - gesture.startX,
    event.clientY - gesture.startY,
    size
  )
  return true
}

function endViewportPan(event: PointerEvent): boolean {
  const gesture = viewportPanGesture.value
  if (!gesture || gesture.pointerId !== event.pointerId) return false
  viewportPanGesture.value = null
  if (stageViewportRef.value?.hasPointerCapture(event.pointerId)) {
    stageViewportRef.value.releasePointerCapture(event.pointerId)
  }
  return true
}

watch(
  () => activeCamera.value.enabled,
  (enabled) => {
    if (!enabled) viewportNavigation.value = { zoom: 1, panX: 0, panY: 0 }
  }
)

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
    } else if (editorStore.editScope === 'head' && editorStore.selectedGroupId) {
      editorStore.selectGroupForEditing(editorStore.selectedGroupId)
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
  if (key === 's') {
    event.preventDefault()
    quicksaveBtnRef.value?.triggerSave()
    return
  }
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

function resetBackgroundCover() {
  const layer = activeSelectedLayer.value
  if (!layer || layer.category !== 'background') return
  const cover = computeBackgroundCoverTransform({
    assetWidth: layer.asset.width || stage.value.width,
    assetHeight: layer.asset.height || stage.value.height,
    stageWidth: stage.value.width,
    stageHeight: stage.value.height
  })
  editorStore.updateLayerTransform(layer.layerId, {
    x: cover.x,
    y: cover.y,
    scaleX: cover.scaleX,
    scaleY: cover.scaleY,
    rotation: 0
  })
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
    const renderedW = (layer.width ?? 0) * Math.abs(layer.scaleX ?? 1)
    const renderedH = (layer.height ?? 0) * Math.abs(layer.scaleY ?? 1)
    const isCoveringStage =
      renderedW >= stage.value.width * 0.95 &&
      renderedH >= stage.value.height * 0.95

    const isFullScreenBg =
      layer.category === 'background_overlay' ||
      ((layer.category === 'background' || layer.category === 'foreground') &&
        isCoveringStage &&
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

function activeTransformPivot(bounds: BoxBounds): { x: number; y: number } {
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
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
      const { x: centerX, y: centerY } = activeTransformPivot(selectedBounds.value)
      dragStartAngleRad.value = Math.atan2(pos.y - centerY, pos.x - centerX)

      if (isGroupTarget.value && activeSelectedGroup.value) {
        dragStartRotation.value = activeSelectedGroup.value.transform.rotation ?? 0
      } else if (activeSelectedLayer.value) {
        dragStartRotation.value =
          activeSelectedLayer.value.localRotation ?? activeSelectedLayer.value.rotation ?? 0
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
        const groupLayers = activeLayers.value.filter(
          (l) => l.groupId === activeSelectedGroup.value?.id
        )
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
      if (isGroupTarget.value && activeSelectedGroup.value?.kind === 'character') {
        focusRigInAssetLibrary(activeSelectedGroup.value)
      } else if (activeSelectedLayer.value && isPropLayer(activeSelectedLayer.value)) {
        focusPropInAssetLibrary(
          activeSelectedLayer.value,
          activeSelectedGroup.value?.kind === 'character' ? activeSelectedGroup.value : undefined
        )
      }
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
    const selectWholeGroup = !isRigCalibrationOpen.value && shouldTargetWholeGroup(hitGroup?.kind)
    if (hit.groupId && selectWholeGroup) {
      editorStore.selectGroupForEditing(hit.groupId)
    } else if (isRigCalibrationOpen.value && hit.groupId === activeCalibrationGroup.value?.id) {
      editorStore.selectRigLayerForCalibration(hit.layerId)
    } else {
      editorStore.selectLayerForEditing(hit.layerId)
    }
    if (hitGroup?.kind === 'character' && selectWholeGroup) focusRigInAssetLibrary(hitGroup)
    else if (isPropLayer(hit)) {
      focusPropInAssetLibrary(hit, hitGroup?.kind === 'character' ? hitGroup : undefined)
    }
    editorStore.beginGesture('Déplacer la sélection')
    assetStore.selectAsset(selectWholeGroup ? null : hit.asset.id)

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
    if (!editorStore.hasActiveGesture) {
      if (editorStore.editScope === 'head' && editorStore.selectedGroupId) {
        editorStore.selectGroupForEditing(editorStore.selectedGroupId)
      } else {
        editorStore.clearStudioSelection()
      }
    }
  }
}

function onStagePointerDown(event: PointerEvent): void {
  if (!beginViewportPan(event)) onCanvasPointerDown(event)
}

function onStagePointerMove(event: PointerEvent): void {
  if (!updateViewportPan(event)) onCanvasPointerMove(event)
}

function onStagePointerUp(event: PointerEvent): void {
  if (!endViewportPan(event)) onCanvasPointerUp(event)
}

function onCanvasPointerMove(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // A. Rotation
  if (isRotating.value && selectedBounds.value) {
    const { x: centerX, y: centerY } = activeTransformPivot(selectedBounds.value)
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
      const rigUnitScale =
        activeSelectedLayer.value.groupId === activeCalibrationGroup.value?.id &&
        activeSelectedLayer.value.asset.width > 0
          ? activeSelectedLayer.value.width / activeSelectedLayer.value.asset.width
          : 1
      const newX = Math.round(dragStartLayerPos.value.x + dx / rigUnitScale)
      const newY = Math.round(dragStartLayerPos.value.y + dy / rigUnitScale)
      editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, { x: newX, y: newY })
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
    ['head', 'mouth', 'props_character'].includes(hit.category) &&
    editorStore.currentDocument.groups.some(
      (group) =>
        group.id === hit.groupId && group.kind === 'character' && group.activeMode === 'rig'
    )
  ) {
    const head = activeLayers.value.find(
      (layer) => layer.groupId === hit.groupId && layer.category === 'head'
    )
    if (head) {
      editorStore.selectHeadForEditing(head.layerId)
      assetStore.selectAsset(head.asset.id)
      return
    }
  }
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
    if (hitGroup?.kind === 'character' && editorStore.editScope === 'group') {
      focusRigInAssetLibrary(hitGroup)
    } else if (isPropLayer(hit)) {
      focusPropInAssetLibrary(hit, hitGroup?.kind === 'character' ? hitGroup : undefined)
    }
    assetStore.selectAsset(editorStore.editScope === 'group' ? null : hit.asset.id)
  } else if (!hit && !editorStore.hasActiveGesture) {
    if (editorStore.editScope === 'head' && editorStore.selectedGroupId) {
      editorStore.selectGroupForEditing(editorStore.selectedGroupId)
    } else {
      editorStore.clearStudioSelection()
    }
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
        maxWidth: '100%',
        ...viewportTransformStyle
      }"
      :data-viewport-zoom="viewportNavigation.zoom.toFixed(3)"
      @wheel="onViewportWheel"
      @pointerdown="onStagePointerDown"
      @pointermove="onStagePointerMove"
      @pointerup="onStagePointerUp"
      @pointercancel="onStagePointerUp"
      @pointerleave="onStagePointerUp"
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
      />

      <DepthOfFieldOverlay
        v-if="isDepthOfFieldEditorOpen && !activeCamera.enabled"
        :model-value="depthOfField"
        :stage-height="stage.height"
        @interaction-start="beginDepthOfFieldInteraction"
        @update:model-value="scheduleDepthOfFieldUpdate"
        @commit="commitDepthOfFieldUpdate"
      />

      <Teleport defer to="#studio-global-toolbar-host">
        <StudioGlobalToolbar
          :active-camera="activeCamera"
          :depth-of-field="depthOfField"
          :has-visual-effects="hasVisualEffects"
          :is-saved-snapshots-open="isSavedSnapshotsOpen"
          :is-visual-effects-open="isVisualEffectsEditorOpen"
          :is-depth-of-field-editor-open="isDepthOfFieldEditorOpen"
          :can-undo="Boolean(editorStore.canUndo && !isDragging && !isResizing)"
          :can-redo="Boolean(editorStore.canRedo && !isDragging && !isResizing)"
          @open-export="emit('openExport')"
          @toggle-saved-snapshots="emit('toggleSavedSnapshots')"
          @update-visual-effects-open="setVisualEffectsEditorOpen"
          @update-depth-of-field-editor-open="setDepthOfFieldEditorOpen"
          @toggle-camera-frame="toggleCameraFrame"
          @undo="undoCanvasTransform"
          @redo="redoCanvasTransform"
          @start-tour="(key) => emit('startTour', key)"
        >
          <template #visualEffects>
            <VisualEffectsControls
              v-model:color-grading="colorGradingModel"
              v-model:shader-settings="shaderModel"
              @interaction-start="beginVisualEffectsInteraction"
              @interaction-end="endVisualEffectsInteraction"
              @reset-all="resetVisualEffects"
            />
          </template>

          <template #depthOfField>
            <DepthOfFieldControls
              :model-value="depthOfField"
              @interaction-start="beginDepthOfFieldInteraction"
              @update:model-value="scheduleDepthOfFieldUpdate"
              @commit="commitDepthOfFieldUpdate"
            />
          </template>
        </StudioGlobalToolbar>
      </Teleport>

      <!-- Outils contextuels flottants liés à la sélection dans le viewport -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
      >
        <StudioSelectionToolbar
          v-if="isSelectionToolsOpen && !isRigCalibrationOpen"
          :open="isSelectionToolsOpen"
          :layer-name="
            isGroupTarget && activeSelectedGroup
              ? activeSelectedGroup.name
              : activeSelectedLayer?.name || activeSelectedLayer?.asset.name || 'Calque'
          "
          :layer-icon="
            activeSelectedLayer
              ? ASSET_CATEGORIES[activeSelectedLayer.category]?.icon || 'layers'
              : 'layers'
          "
          :can-edit-desk-placement="canEditSelectedDeskPlacement"
          :desk-placement="selectedDeskPlacement"
          :can-edit-desk-split="Boolean(selectedDeskAsset)"
          :desk-split-open="isDeskSplitModalOpen"
          :blur-enabled="selectedBlurEnabled"
          :flipped="isSelectedFlippedHorizontally"
          :delete-label="deleteSelectionLabel"
          :is-background="activeSelectedLayer?.category === 'background'"
          @update:desk-placement="selectedDeskPlacement = $event"
          @open-desk-split="openDeskSplitEditor"
          @toggle-blur="toggleSelectedBlur"
          @flip="flipSelectedHorizontal"
          @delete="removeSelectedFromViewport"
          @clear-selection="editorStore.clearStudioSelection()"
          @reset-cover="resetBackgroundCover"
        />
      </Transition>
    </div>

    <!-- Boutons d'actions rapides flottants en bas à droite du viewport -->
    <div class="absolute bottom-5 right-5 z-40 flex items-center gap-2">
      <ViewportQuickExportButton />
      <ViewportQuicksaveButton ref="quicksaveBtn" />
    </div>

    <!-- Modale de calibrage de découpe 2.5D du bureau -->
    <DeskSplitModal
      v-if="deskSplitAsset"
      v-model="isDeskSplitModalOpen"
      :asset="deskSplitAsset"
      @save="handleSaveDeskSplit"
    />
  </div>
</template>
