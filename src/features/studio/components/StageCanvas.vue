<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { getCachedAssetImage, useCanvasRenderer } from '../composables/useCanvasRenderer'
import { isLayerPointOpaque } from '../engine/alpha-hit-test'
import { shouldTargetWholeGroup } from '../engine/selection-target'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CameraFrameOverlay } from '@/components/ui/camera-frame-overlay'
import type { CameraFrame } from '@core/types/editor.types'

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const assetStore = useAssetStore()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()

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
    return (
      activeLayers.value.find((layer) => layer.groupId === editorStore.selectedGroupId) ?? null
    )
  }

  return null
})

const activeSelectedGroup = computed(() => {
  if (!editorStore.selectedGroupId) return null
  return (
    editorStore.currentDocument.groups?.find(
      (group) => group.id === editorStore.selectedGroupId
    ) ?? null
  )
})

const isGroupTarget = computed(() => {
  return editScope.value === 'group' && Boolean(activeSelectedGroup.value)
})

const activeCamera = computed<CameraFrame>({
  get: () => editorStore.currentDocument.camera,
  set: (camera) => editorStore.updateCamera(camera)
})

const showSelection = computed(() => !activeCamera.value.enabled)

function toggleCameraFrame() {
  const current = activeCamera.value
  const enabled = !current.enabled
  const frameFitsStage =
    current.width >= 64 && current.height >= 64 &&
    current.x >= 0 && current.y >= 0 &&
    current.x + current.width <= stage.value.width &&
    current.y + current.height <= stage.value.height

  editorStore.clearStudioSelection()
  editorStore.updateCamera(frameFitsStage
    ? { ...current, enabled }
    : {
        enabled,
        x: 0,
        y: 0,
        width: stage.value.width,
        height: stage.value.height,
        aspectRatio: 'custom'
      })
}

function commitCameraFrame(camera: CameraFrame) {
  editorStore.updateCamera(camera)
}

// Calcul des bornes englobantes (Bounding Box) du groupe ou du calque individuel
const selectedBounds = computed<BoxBounds | null>(() => {
  if (!activeSelectedLayer.value) return null

  if (isGroupTarget.value && activeSelectedGroup.value) {
    const groupLayers = activeLayers.value.filter((l) => l.groupId === activeSelectedGroup.value?.id)
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
    const scaleX = activeSelectedGroup.value.transform?.scaleX ?? 1
    const scaleY = activeSelectedGroup.value.transform?.scaleY ?? 1
    return `Groupe : ${activeSelectedGroup.value.name} (X ${scaleX.toFixed(2)}× · Y ${scaleY.toFixed(2)}×)`
  }
  const l = activeSelectedLayer.value
  return `${l.name || l.asset.name} (X ${l.scaleX.toFixed(2)}× · Y ${l.scaleY.toFixed(2)}×)`
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
  showSelection
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

const currentScaleX = computed(() => {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    return activeSelectedGroup.value.transform?.scaleX ?? 1
  }
  return activeSelectedLayer.value?.localScaleX ?? activeSelectedLayer.value?.scaleX ?? 1
})

const currentScaleY = computed(() => {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    return activeSelectedGroup.value.transform?.scaleY ?? 1
  }
  return activeSelectedLayer.value?.localScaleY ?? activeSelectedLayer.value?.scaleY ?? 1
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
    editorStore.undoLastTransform()
  }
}

function redoCanvasTransform() {
  if (!isDragging.value && !isResizing.value) {
    editorStore.redoLastTransform()
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
    if (editorStore.hasActiveTransformSession) {
      editorStore.cancelTransformSession()
    } else {
      editorStore.clearStudioSelection(false)
    }
    return
  }
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return

  const key = event.key.toLowerCase()
  if (key === 'z' && event.shiftKey && editorStore.canRedoTransform) {
    event.preventDefault()
    redoCanvasTransform()
  } else if (key === 'z' && editorStore.canUndoTransform) {
    event.preventDefault()
    undoCanvasTransform()
  } else if (key === 'y' && editorStore.canRedoTransform) {
    event.preventDefault()
    redoCanvasTransform()
  }
}

onMounted(() => window.addEventListener('keydown', onHistoryKeydown))
onUnmounted(() => window.removeEventListener('keydown', onHistoryKeydown))

function clampScale(value: number) {
  return Number(Math.max(0.05, Math.min(5, value)).toFixed(2))
}

function applyScaleAxes(newScaleX: number, newScaleY: number) {
  const clampedX = clampScale(newScaleX)
  const clampedY = clampScale(newScaleY)

  if (isGroupTarget.value && activeSelectedGroup.value) {
    editorStore.updateGroupTransform(activeSelectedGroup.value.id, {
      scaleX: clampedX,
      scaleY: clampedY
    })
  } else if (activeSelectedLayer.value) {
    editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, {
      scaleX: clampedX,
      scaleY: clampedY
    })
  }
}

function adjustScale(delta: number) {
  editorStore.beginTransformGesture()
  applyScaleAxes(currentScaleX.value + delta, currentScaleY.value + delta)
  editorStore.endTransformGesture()
}

function setExactScale(value: number) {
  editorStore.beginTransformGesture()
  applyScaleAxes(value, value)
  editorStore.endTransformGesture()
}

function onCanvasWheel(e: WheelEvent) {
  if (e.altKey || e.shiftKey) {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.05 : -0.05
    adjustScale(delta)
  }
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

function hitTestResizeHandle(pos: { x: number; y: number }, bounds: BoxBounds): ResizeHandle | null {
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
      (layer.width >= stage.value.width * 0.95 && layer.height >= stage.value.height * 0.95 && !layer.isMovable)

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
  if (selectedBounds.value) {
    const hitHandle = hitTestResizeHandle(pos, selectedBounds.value)
    if (hitHandle) {
      editorStore.beginTransformGesture()
      isResizing.value = true
      activeHandle.value = hitHandle
      dragStartPointer.value = { ...pos }
      dragStartBounds.value = { ...selectedBounds.value }
      dragStartScale.value = { x: currentScaleX.value, y: currentScaleY.value }

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    }

    // 2. Clic à l'intérieur de la boîte de sélection active (Déplacement)
    const b = selectedBounds.value
    const isInsideSelection =
      pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height
    if (isInsideSelection) {
      editorStore.beginTransformGesture()
      isDragging.value = true
      dragStartPointer.value = { ...pos }

      if (isGroupTarget.value && activeSelectedGroup.value) {
        dragStartGroupPos.value = {
          x: activeSelectedGroup.value.transform?.x ?? 0,
          y: activeSelectedGroup.value.transform?.y ?? 0
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
    const selectWholeGroup = shouldTargetWholeGroup(hit.groupId, hit.category, editScope.value, e.shiftKey)
    if (hit.groupId && selectWholeGroup) {
      editorStore.selectGroupForEditing(hit.groupId)
    } else {
      editorStore.selectLayerForEditing(hit.layerId)
    }
    editorStore.beginTransformGesture()
    assetStore.selectAsset(hit.asset.id)

    isDragging.value = true
    dragStartPointer.value = { ...pos }

    if (selectWholeGroup && hit.groupId) {
      const grp = editorStore.currentDocument.groups?.find((g) => g.id === hit.groupId)
      dragStartGroupPos.value = { x: grp?.transform?.x ?? 0, y: grp?.transform?.y ?? 0 }
    } else {
      dragStartLayerPos.value = { x: hit.localX ?? 0, y: hit.localY ?? 0 }
    }

    const target = e.currentTarget as HTMLElement
    target?.setPointerCapture?.(e.pointerId)
  } else {
    if (!editorStore.hasActiveTransformSession) editorStore.clearStudioSelection(false)
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
    applyScaleAxes(scales.scaleX, scales.scaleY)
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
      if (activeSelectedGroup.value.id === 'grp_berlu') {
        editorStore.updateCharacterTransform({ x: newGroupX, y: newGroupY })
      }
    } else if (activeSelectedLayer.value) {
      if (activeSelectedLayer.value.category === 'background') {
        const clamped = clampBackgroundCover(
          {
            x: dragStartLayerPos.value.x + dx,
            y: dragStartLayerPos.value.y + dy,
            scaleX: currentScaleX.value,
            scaleY: currentScaleY.value
          },
          {
            assetWidth: activeSelectedLayer.value.asset.width || stage.value.width,
            assetHeight: activeSelectedLayer.value.asset.height || stage.value.height,
            stageWidth: stage.value.width,
            stageHeight: stage.value.height
          }
        )
        editorStore.updateLayerTransform(activeSelectedLayer.value.layerId, { x: clamped.x, y: clamped.y })
      } else {
        const newX = Math.round(dragStartLayerPos.value.x + dx)
        const newY = Math.round(dragStartLayerPos.value.y + dy)
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
  const restoreGroupId = (isDragging.value || isResizing.value) && !isGroupTarget.value
    ? activeSelectedLayer.value?.groupId
    : undefined
  isDragging.value = false
  isResizing.value = false
  activeHandle.value = null
  editorStore.endTransformGesture()
  if (restoreGroupId) editorStore.selectGroupForEditing(restoreGroupId)

  const target = e.currentTarget as HTMLElement
  if (target?.hasPointerCapture?.(e.pointerId)) {
    target.releasePointerCapture(e.pointerId)
  }
}

function onCanvasDoubleClick(e: MouseEvent) {
  const pos = getStageCoordinates(e as unknown as PointerEvent)
  if (!pos) return

  const hit = hitTestLayer(pos)
  if (hit && hit.groupId) {
    if (e.shiftKey) {
      editorStore.selectGroupForEditing(hit.groupId)
    } else {
      editorStore.selectLayerForEditing(hit.layerId)
    }
    assetStore.selectAsset(hit.asset.id)
  } else if (!hit && !editorStore.hasActiveTransformSession) {
    editorStore.clearStudioSelection(false)
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
      @wheel.prevent="onCanvasWheel"
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

      <div
        class="absolute top-3 right-3 z-40 flex items-center gap-1 rounded-xl border border-border-default bg-bg-elevated/95 p-1 shadow-glass-md backdrop-blur-md"
        @pointerdown.stop
        @dblclick.stop
      >
        <Badge variant="neutral" size="sm" class="font-mono text-[10px] mx-1">
          {{ stage.width }} × {{ stage.height }}
        </Badge>
        <IconButton
          icon="crop_free"
          size="xs"
          variant="ghost"
          :active="activeCamera.enabled"
          :aria-label="activeCamera.enabled ? 'Désactiver le cadrage caméra' : 'Activer le cadrage caméra'"
          :title="activeCamera.enabled ? 'Désactiver le cadrage' : 'Activer le cadrage caméra'"
          @click="toggleCameraFrame"
        />
        <IconButton
          icon="undo"
          size="xs"
          variant="ghost"
          aria-label="Annuler la dernière transformation"
          aria-keyshortcuts="Control+Z Meta+Z"
          title="Annuler (Ctrl/Cmd+Z)"
          :disabled="!editorStore.canUndoTransform || isDragging || isResizing"
          @click="undoCanvasTransform"
        />
        <IconButton
          icon="redo"
          size="xs"
          variant="ghost"
          aria-label="Rétablir la dernière transformation"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          title="Rétablir (Ctrl/Cmd+Shift+Z ou Ctrl+Y)"
          :disabled="!editorStore.canRedoTransform || isDragging || isResizing"
          @click="redoCanvasTransform"
        />
        <Button
          v-if="editorStore.hasActiveTransformSession"
          size="xs"
          variant="primary"
          class="ml-1 gap-1 font-bold"
          title="Valider toutes les modifications"
          @click="editorStore.commitTransformSession()"
        >
          <Icon name="check" size="xs" />
          OK
        </Button>
      </div>

      <!-- HUD contextuel d'Édition Directe (Bannière Inférieure) -->
      <div
        v-if="activeSelectedLayer"
        class="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200"
        @pointerdown.stop
      >
        <div class="px-3 py-1.5 rounded-xl bg-bg-elevated/95 backdrop-blur-md border border-border-default shadow-glass-md flex items-center gap-3 text-xs">
          <!-- Nom & Icône du calque sélectionné -->
          <span class="font-semibold text-text-primary flex items-center gap-1.5">
            <Icon
              :name="ASSET_CATEGORIES[activeSelectedLayer.category]?.icon || 'layers'"
              size="xs"
              class="text-primary"
            />
            <span>{{ isGroupTarget && activeSelectedGroup ? activeSelectedGroup.name : (activeSelectedLayer.name || activeSelectedLayer.asset.name) }}</span>
          </span>

          <!-- Contrôle de l'Échelle (Scale) -->
          <div class="flex items-center gap-1 pl-2 border-l border-border-subtle/60">
            <span class="text-[10px] text-text-muted">Échelle :</span>
            <IconButton
              icon="remove"
              size="xs"
              variant="secondary"
              class="w-5 h-5 rounded bg-bg-surface hover:bg-bg-surface-hover text-text-muted hover:text-text-primary border border-border-subtle flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              title="Réduire l'échelle (-0.05)"
              @click="adjustScale(-0.05)"
            />
            <span class="font-mono text-[10px] font-bold text-primary min-w-[82px] text-center">
              X {{ currentScaleX.toFixed(2) }}× · Y {{ currentScaleY.toFixed(2) }}×
            </span>
            <IconButton
              icon="add"
              size="xs"
              variant="secondary"
              class="w-5 h-5 rounded bg-bg-surface hover:bg-bg-surface-hover text-text-muted hover:text-text-primary border border-border-subtle flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              title="Augmenter l'échelle (+0.05)"
              @click="adjustScale(0.05)"
            />
            <Button
              v-if="currentScaleX !== 1 || currentScaleY !== 1"
              size="xs"
              variant="ghost"
              class="text-[9px] font-bold text-text-muted hover:text-text-primary px-1 py-0.5 rounded border border-border-subtle hover:bg-bg-surface-hover cursor-pointer ml-0.5"
              title="Rétablir l'échelle à 1.00×"
              @click="setExactScale(1)"
            >
              1:1
            </Button>
          </div>

          <!-- Dimensions en direct -->
          <span v-if="selectedBounds" class="text-[10px] text-text-muted font-mono pl-1 border-l border-border-subtle/60">
            {{ selectedBounds.width }}&times;{{ selectedBounds.height }}px
          </span>

          <IconButton
            v-if="!isGroupTarget"
            icon="delete"
            size="xs"
            variant="destructive"
            :aria-label="`Supprimer ${activeSelectedLayer.asset.name}`"
            title="Supprimer ce calque"
            @click="editorStore.removeLayer(activeSelectedLayer.layerId)"
          />

          <!-- Bouton Désélectionner / Fermer HUD -->
          <IconButton
            icon="close"
            size="xs"
            variant="ghost"
            class="text-text-muted hover:text-text-primary size-5 p-0"
            title="Désélectionner"
            @click="editorStore.clearStudioSelection()"
          />
        </div>
      </div>
    </div>
  </div>
</template>
