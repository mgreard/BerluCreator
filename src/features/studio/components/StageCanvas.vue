<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { getCachedAssetImage, useCanvasRenderer } from '../composables/useCanvasRenderer'
import { isLayerPointOpaque } from '../engine/alpha-hit-test'
import { isActiveSelectionHit, shouldTargetWholeGroup } from '../engine/selection-target'
import { clampBackgroundCover } from '../engine/background-cover.engine'
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
import { CameraFrameOverlay } from '@/components/ui/camera-frame-overlay'
import {
  DepthOfFieldOverlay,
  type DepthOfFieldOverlayValue
} from '@/components/ui/depth-of-field-overlay'
import type { CameraFrame, CharacterGroup } from '@core/types/editor.types'
import { toast } from '@/ui/shared/services/toast.service'
import { useRigCatalogStore } from '../rig-calibration/rig-catalog.store'
import { useRigRuntime } from '../rig-calibration/useRigRuntime'

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

// Mode d'édition : 'group' (déplace/scale tout le groupe) vs 'layer' (positionne/scale ce calque spécifique)
const editScope = computed({
  get: () => editorStore.editScope,
  set: (scope: 'group' | 'layer') => {
    if (scope === 'group' && activeSelectedGroup.value) {
      editorStore.selectGroupForEditing(activeSelectedGroup.value.id)
    } else if (scope === 'layer' && activeSelectedLayer.value) {
      editorStore.selectLayerForEditing(activeSelectedLayer.value.layerId)
    }
  }
})

const selectedLayerId = computed(() => editorStore.selectedLayerId)

const activeSelectedLayer = computed(() => {
  if (editorStore.selectedLayerId) {
    const selected = activeLayers.value.find(
      (layer) => layer.layerId === editorStore.selectedLayerId
    )
    if (selected) return selected
  }

  if (editorStore.selectedGroupId) {
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
let depthOfFieldFrame: number | null = null
let pendingDepthOfField: DepthOfFieldOverlayValue | null = null
let hasDepthOfFieldGesture = false

const showSelection = computed(() => !activeCamera.value.enabled)

const deskPlacementOptions: SegmentOption[] = [
  { value: 'behind', label: 'Derrière', icon: 'flip_to_back' },
  { value: 'front', label: 'Devant', icon: 'flip_to_front' }
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

const canEditSelectedDeskPlacement = computed(
  () => editScope.value === 'layer' && editorStore.selectedLayer?.category === 'props_set'
)

const selectedDeskPlacement = computed<string>({
  get: () =>
    (editorStore.selectedLayer?.zIndex ?? ASSET_CATEGORIES.props_set.defaultZIndex) <
    deskReferenceZIndex.value
      ? 'behind'
      : 'front',
  set: (value) => {
    const layer = editorStore.selectedLayer
    if (!layer || (value !== 'behind' && value !== 'front')) return
    editorStore.updateLayerZIndex(
      layer.id,
      deskReferenceZIndex.value + (value === 'behind' ? -1 : 1)
    )
  }
})

const canEditSelectedDepthRole = computed(
  () =>
    depthOfField.value.enabled &&
    editScope.value === 'layer' &&
    editorStore.selectedLayer?.category === 'props_set'
)

const isSelectedBlurred = computed(
  () => editorStore.selectedLayer?.depthRole === 'background'
)

function toggleSelectedBlur() {
  const layer = editorStore.selectedLayer
  if (!layer) return
  editorStore.setLayerDepthRole(layer.id, isSelectedBlurred.value ? 'subject' : 'background')
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
const activeHandle = ref<ResizeHandle | null>(null)
const hoveredHandle = ref<ResizeHandle | null>(null)
const hoveredLayer = ref<RenderableLayer | null>(null)

const dragStartPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartBounds = ref<BoxBounds>({ x: 0, y: 0, width: 0, height: 0 })
const dragStartScale = ref({ x: 1, y: 1 })
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
  if (handle === 'left' || handle === 'right') return 'cursor-ew-resize'
  if (handle === 'top' || handle === 'bottom') return 'cursor-ns-resize'
  if (handle === 'tl' || handle === 'br') return 'cursor-nwse-resize'
  if (handle === 'tr' || handle === 'bl') return 'cursor-nesw-resize'
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

  // 1. Clic sur l'une des 8 poignées de redimensionnement
  if (selectedBounds.value && !isSelectionLocked.value) {
    const hitHandle = hitTestResizeHandle(pos, selectedBounds.value)
    if (hitHandle) {
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

    // 2. Clic à l'intérieur de la boîte de sélection active (Déplacement)
    const b = selectedBounds.value
    const isInsideSelection =
      pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height
    if (isInsideSelection) {
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
    const selectWholeGroup =
      !isRigCalibrationOpen.value &&
      shouldTargetWholeGroup(hit.groupId, hit.category, editScope.value, e.shiftKey)
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

  // A. Redimensionnement
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

  // B. Déplacement (Translation)
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

  // C. Survol
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
    if (isRigCalibrationOpen.value && hit.groupId === activeCalibrationGroup.value?.id) {
      editorStore.selectRigLayerForCalibration(hit.layerId)
    } else if (e.shiftKey) {
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

      <!-- HUD contextuel d'Édition Directe (Bannière Inférieure) -->
      <div
        v-if="activeSelectedLayer && !isRigCalibrationOpen"
        class="absolute bottom-3 left-3 z-30 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200"
        @pointerdown.stop
      >
        <div
          class="viewport-glass flex items-center gap-3 rounded-xl border px-3 py-1.5 text-xs transition-all duration-300 ease-out"
        >
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
            <span class="text-[10px] font-semibold text-white/60">Bureau</span>
            <SegmentedControl
              v-model="selectedDeskPlacement"
              :options="deskPlacementOptions"
              size="sm"
              variant="primary"
              class="bg-bg-surface/30"
              aria-label="Position de l’accessoire par rapport au bureau"
            />
          </div>

          <IconButton
            v-if="canEditSelectedDepthRole"
            icon="blur_on"
            size="xs"
            variant="ghost"
            class="viewport-action"
            :active="isSelectedBlurred"
            :aria-label="
              isSelectedBlurred
                ? 'Désactiver le flou (Placer au premier plan)'
                : 'Activer le flou (Placer en arrière-plan)'
            "
            :title="isSelectedBlurred ? 'Désactiver le flou' : 'Activer le flou'"
            @click="toggleSelectedBlur"
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
