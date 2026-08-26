<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import {
  useTimelineStore,
  type TransformHistoryTarget
} from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'
import { computeTransformedBounds, type BoxBounds } from '../engine/transform-matrix'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import type { Transform2D } from '@core/types/timeline.types'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'

type CornerHandle = 'tl' | 'tr' | 'bl' | 'br'

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()

// Mode d'édition : 'group' (déplace/scale tout le groupe) vs 'layer' (ouvre le groupe pour positionner/scaler ce sprite spécifique)
const editScope = computed({
  get: () => timelineStore.editScope,
  set: (scope: 'group' | 'layer') => {
    timelineStore.editScope = scope
  }
})

const editScopeOptions: SegmentOption[] = [
  { value: 'group', label: 'Groupe entier', icon: 'workspaces' },
  { value: 'layer', label: 'Ouvrir groupe', icon: 'crop_free' }
]

const selectedTrackId = computed(() => timelineStore.selectedTrackId)

const activeSelectedLayer = computed(() => {
  const selectedLayer = activeLayers.value.find(
    (layer) => layer.trackId === timelineStore.selectedTrackId
  )
  if (selectedLayer) return selectedLayer

  if (timelineStore.selectedGroupId) {
    return (
      activeLayers.value.find((layer) => layer.groupId === timelineStore.selectedGroupId) ?? null
    )
  }

  return null
})

const activeSelectedGroup = computed(() => {
  if (!timelineStore.selectedGroupId) return null
  return (
    timelineStore.currentSequence.groups?.find(
      (group) => group.id === timelineStore.selectedGroupId
    ) ?? null
  )
})

const isGroupTarget = computed(() => {
  return editScope.value === 'group' && Boolean(activeSelectedGroup.value)
})

// Calcul des bornes englobantes (Bounding Box) du groupe ou du sprite individuel
const selectedBounds = computed<BoxBounds | null>(() => {
  if (!activeSelectedLayer.value) return null

  if (isGroupTarget.value && activeSelectedGroup.value) {
    // Calculer le rectangle englobant composé de tous les calques visibles du groupe
    const groupLayers = activeLayers.value.filter((l) => l.groupId === activeSelectedGroup.value?.id)
    if (groupLayers.length === 0) {
      const l = activeSelectedLayer.value
      return computeTransformedBounds(l.x, l.y, l.width, l.height, l.scaleX, l.scaleY)
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    for (const l of groupLayers) {
      const b = computeTransformedBounds(l.x, l.y, l.width, l.height, l.scaleX, l.scaleY)
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

  // Sprite unique
  const l = activeSelectedLayer.value
  return computeTransformedBounds(l.x, l.y, l.width, l.height, l.scaleX, l.scaleY)
})

// Libellé informatif affiché sur la boîte de sélection
const targetLabel = computed<string | null>(() => {
  if (!activeSelectedLayer.value) return null
  if (isGroupTarget.value && activeSelectedGroup.value) {
    const scale = activeSelectedGroup.value.transform?.scaleX ?? 1
    return `Groupe : ${activeSelectedGroup.value.name} (${scale.toFixed(2)}×)`
  }
  const l = activeSelectedLayer.value
  return `${l.trackName || l.asset.name} (${(l.scaleX ?? 1).toFixed(2)}×)`
})

// Envoi vers le moteur de rendu
useCanvasRenderer(
  canvasRef,
  activeLayers,
  stage,
  selectedTrackId,
  selectedBounds,
  targetLabel,
  isGroupTarget
)

// --- GESTION DU DRAG & DROP ET DU RESIZE INTERACTIF ---
const isDragging = ref(false)
const isResizing = ref(false)
const activeCorner = ref<CornerHandle | null>(null)
const hoveredCorner = ref<CornerHandle | null>(null)
const hoveredLayer = ref<RenderableLayer | null>(null)

const dragStartPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartBounds = ref<BoxBounds>({ x: 0, y: 0, width: 0, height: 0 })
const dragStartScale = ref<number>(1)
const dragStartLayerPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartGroupPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
let pendingTransformAction: {
  target: TransformHistoryTarget
  before: Partial<Transform2D> | undefined
} | null = null

const currentScale = computed(() => {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    return activeSelectedGroup.value.transform?.scaleX ?? 1
  }
  return activeSelectedLayer.value?.localScaleX ?? activeSelectedLayer.value?.scaleX ?? 1
})

function getCurrentTransformTarget(): TransformHistoryTarget | null {
  if (isGroupTarget.value && activeSelectedGroup.value) {
    return { kind: 'group', groupId: activeSelectedGroup.value.id }
  }
  if (activeSelectedLayer.value?.keyframeId) {
    return {
      kind: 'keyframe',
      trackId: activeSelectedLayer.value.trackId,
      keyframeId: activeSelectedLayer.value.keyframeId
    }
  }
  return null
}

function readTransformSnapshot(
  target: TransformHistoryTarget
): Partial<Transform2D> | undefined {
  if (target.kind === 'group') {
    const group = timelineStore.currentSequence.groups?.find(
      (candidate) => candidate.id === target.groupId
    )
    return group?.transform ? { ...group.transform } : undefined
  }

  const track = timelineStore.currentSequence.tracks.find(
    (candidate) => candidate.id === target.trackId
  )
  const keyframe = track?.keyframes.find(
    (candidate) => candidate.id === target.keyframeId
  )
  return keyframe?.transform ? { ...keyframe.transform } : undefined
}

function beginTransformAction() {
  const target = getCurrentTransformTarget()
  if (!target) return
  pendingTransformAction = {
    target,
    before: readTransformSnapshot(target)
  }
}

function commitTransformAction() {
  if (!pendingTransformAction) return
  timelineStore.recordTransformAction(
    pendingTransformAction.target,
    pendingTransformAction.before,
    readTransformSnapshot(pendingTransformAction.target)
  )
  pendingTransformAction = null
}

function runDiscreteTransformAction(action: () => void) {
  const target = getCurrentTransformTarget()
  if (!target) {
    action()
    return
  }
  const before = readTransformSnapshot(target)
  action()
  timelineStore.recordTransformAction(target, before, readTransformSnapshot(target))
}

function undoCanvasTransform() {
  if (!isDragging.value && !isResizing.value) {
    timelineStore.undoLastTransform()
  }
}

function redoCanvasTransform() {
  if (!isDragging.value && !isResizing.value) {
    timelineStore.redoLastTransform()
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
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return

  const key = event.key.toLowerCase()
  if (key === 'z' && event.shiftKey && timelineStore.canRedoTransform) {
    event.preventDefault()
    redoCanvasTransform()
  } else if (key === 'z' && timelineStore.canUndoTransform) {
    event.preventDefault()
    undoCanvasTransform()
  } else if (key === 'y' && timelineStore.canRedoTransform) {
    event.preventDefault()
    redoCanvasTransform()
  }
}

onMounted(() => window.addEventListener('keydown', onHistoryKeydown))
onUnmounted(() => window.removeEventListener('keydown', onHistoryKeydown))

function applyScale(newScale: number) {
  const clamped = Number(Math.max(0.05, Math.min(5.0, newScale)).toFixed(2))

  if (isGroupTarget.value && activeSelectedGroup.value) {
    timelineStore.updateGroupTransform(activeSelectedGroup.value.id, {
      scaleX: clamped,
      scaleY: clamped
    })
  } else if (activeSelectedLayer.value?.keyframeId) {
    timelineStore.updateKeyframeTransform(
      activeSelectedLayer.value.trackId,
      activeSelectedLayer.value.keyframeId,
      {
        scaleX: clamped,
        scaleY: clamped
      }
    )
  }
}

function adjustScale(delta: number) {
  runDiscreteTransformAction(() => applyScale(currentScale.value + delta))
}

function setExactScale(value: number) {
  runDiscreteTransformAction(() => applyScale(value))
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

function hitTestCornerHandle(pos: { x: number; y: number }, bounds: BoxBounds): CornerHandle | null {
  const handleRadius = 10
  const corners: { corner: CornerHandle; x: number; y: number }[] = [
    { corner: 'tl', x: bounds.x, y: bounds.y },
    { corner: 'tr', x: bounds.x + bounds.width, y: bounds.y },
    { corner: 'bl', x: bounds.x, y: bounds.y + bounds.height },
    { corner: 'br', x: bounds.x + bounds.width, y: bounds.y + bounds.height }
  ]

  for (const c of corners) {
    const dist = Math.hypot(pos.x - c.x, pos.y - c.y)
    if (dist <= handleRadius) {
      return c.corner
    }
  }
  return null
}

function hitTestLayer(pos: { x: number; y: number }): RenderableLayer | null {
  const reversed = [...activeLayers.value].reverse()

  for (const layer of reversed) {
    const isFullScreenBg =
      layer.category === 'backdrop' ||
      (layer.category === 'overlay' && !layer.isMovable) ||
      (layer.width >= stage.value.width * 0.95 && layer.height >= stage.value.height * 0.95 && !layer.isMovable)

    if (isFullScreenBg) continue

    const b = computeTransformedBounds(layer.x, layer.y, layer.width, layer.height, layer.scaleX, layer.scaleY)
    if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
      return layer
    }
  }

  return null
}

function onCanvasPointerDown(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // 1. Priorité 1 : Clic sur l'une des 4 poignées de redimensionnement de la sélection active
  if (selectedBounds.value) {
    const hitCorner = hitTestCornerHandle(pos, selectedBounds.value)
    if (hitCorner) {
      beginTransformAction()
      isResizing.value = true
      activeCorner.value = hitCorner
      dragStartPointer.value = { ...pos }
      dragStartBounds.value = { ...selectedBounds.value }
      dragStartScale.value = currentScale.value

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    }

    // 2. Priorité 2 : Clic à l'intérieur de la boîte de sélection active (Déplacement direct)
    const b = selectedBounds.value
    if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
      beginTransformAction()
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

  // 3. Priorité 3 : Sélection d'un autre élément au clic
  const hit = hitTestLayer(pos)
  if (hit) {
    if (hit.groupId && editScope.value === 'group') {
      timelineStore.selectGroupForEditing(hit.groupId)
    } else {
      timelineStore.selectTrackForEditing(hit.trackId)
    }
    assetStore.selectAsset(hit.asset.id)

    beginTransformAction()
    isDragging.value = true
    dragStartPointer.value = { ...pos }

    if (editScope.value === 'group' && hit.groupId) {
      const grp = timelineStore.currentSequence.groups?.find((g) => g.id === hit.groupId)
      dragStartGroupPos.value = { x: grp?.transform?.x ?? 0, y: grp?.transform?.y ?? 0 }
    } else {
      dragStartLayerPos.value = { x: hit.localX ?? 0, y: hit.localY ?? 0 }
    }

    const target = e.currentTarget as HTMLElement
    target?.setPointerCapture?.(e.pointerId)
  } else {
    // Clic sur le vide
    timelineStore.clearStudioSelection()
  }
}

function onCanvasPointerMove(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // A. Redimensionnement fluide par poignée d'angle
  if (isResizing.value && selectedBounds.value) {
    const b = dragStartBounds.value
    const centerX = b.x + b.width / 2
    const centerY = b.y + b.height / 2

    const initialDist = Math.hypot(dragStartPointer.value.x - centerX, dragStartPointer.value.y - centerY)
    const currentDist = Math.hypot(pos.x - centerX, pos.y - centerY)

    if (initialDist > 0) {
      const ratio = currentDist / initialDist
      const newScale = dragStartScale.value * ratio
      applyScale(newScale)
    }
    return
  }

  // B. Déplacement (Translation)
  if (isDragging.value) {
    const dx = pos.x - dragStartPointer.value.x
    const dy = pos.y - dragStartPointer.value.y

    if (isGroupTarget.value && activeSelectedGroup.value) {
      // Déplacement solidaire du groupe complet
      const newGroupX = Math.round(dragStartGroupPos.value.x + dx)
      const newGroupY = Math.round(dragStartGroupPos.value.y + dy)
      timelineStore.updateGroupTransform(activeSelectedGroup.value.id, { x: newGroupX, y: newGroupY })
    } else if (activeSelectedLayer.value?.keyframeId) {
      // Déplacement de l'élément individuel (coordonnées locales dans le groupe)
      const newX = Math.round(dragStartLayerPos.value.x + dx)
      const newY = Math.round(dragStartLayerPos.value.y + dy)
      timelineStore.updateKeyframeTransform(
        activeSelectedLayer.value.trackId,
        activeSelectedLayer.value.keyframeId,
        { x: newX, y: newY }
      )
    }
    return
  }

  // C. Survol (Hover Cursor Tracking)
  if (selectedBounds.value) {
    hoveredCorner.value = hitTestCornerHandle(pos, selectedBounds.value)
  } else {
    hoveredCorner.value = null
  }
  hoveredLayer.value = hitTestLayer(pos)
}

function onCanvasPointerUp(e: PointerEvent) {
  commitTransformAction()
  isDragging.value = false
  isResizing.value = false
  activeCorner.value = null

  const target = e.currentTarget as HTMLElement
  if (target?.hasPointerCapture?.(e.pointerId)) {
    target.releasePointerCapture(e.pointerId)
  }
}

// Double-clic : bascule rapide entre le mode groupe et le mode isolation du sous-sprite
function onCanvasDoubleClick(e: MouseEvent) {
  const pos = getStageCoordinates(e as unknown as PointerEvent)
  if (!pos) return

  const hit = hitTestLayer(pos)
  if (hit && hit.groupId) {
    if (editScope.value === 'group') {
      timelineStore.selectTrackForEditing(hit.trackId)
    } else {
      timelineStore.selectGroupForEditing(hit.groupId)
    }
    assetStore.selectAsset(hit.asset.id)
  } else if (!hit) {
    timelineStore.clearStudioSelection()
  }
}
</script>

<template>
  <div class="relative flex items-center justify-center w-full h-full overflow-hidden p-4 select-none">
    <div
      class="relative shadow-glass-2xl rounded-xl overflow-hidden border transition-all duration-200 bg-black/90 border-border-subtle/80 ring-1 ring-white/5"
      :class="[
        isResizing
          ? activeCorner === 'tl' || activeCorner === 'br'
            ? 'cursor-nwse-resize'
            : 'cursor-nesw-resize'
          : hoveredCorner
            ? hoveredCorner === 'tl' || hoveredCorner === 'br'
              ? 'cursor-nwse-resize'
              : 'cursor-nesw-resize'
            : isDragging
              ? 'cursor-grabbing'
              : hoveredLayer
                ? 'cursor-grab'
                : 'cursor-default'
      ]"
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

      <div
        class="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-xl border border-border-default bg-bg-elevated/95 p-1 shadow-glass-md backdrop-blur-md"
        @pointerdown.stop
        @dblclick.stop
      >
        <IconButton
          icon="undo"
          size="xs"
          variant="ghost"
          aria-label="Annuler la dernière transformation"
          aria-keyshortcuts="Control+Z Meta+Z"
          title="Annuler le dernier déplacement ou redimensionnement (Ctrl/Cmd+Z)"
          :disabled="!timelineStore.canUndoTransform || isDragging || isResizing"
          @click="undoCanvasTransform"
        />
        <IconButton
          icon="redo"
          size="xs"
          variant="ghost"
          aria-label="Rétablir la dernière transformation"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y"
          title="Rétablir le dernier déplacement ou redimensionnement (Ctrl/Cmd+Shift+Z ou Ctrl+Y)"
          :disabled="!timelineStore.canRedoTransform || isDragging || isResizing"
          @click="redoCanvasTransform"
        />
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
            <span>{{ activeSelectedLayer.asset.name }}</span>
          </span>

          <!-- Groupe & Bascule Ouvrir/Fermer le Groupe -->
          <div v-if="activeSelectedGroup" class="flex items-center gap-1.5 pl-2 border-l border-border-subtle/60">
            <SegmentedControl
              v-model="editScope"
              :options="editScopeOptions"
              size="sm"
              variant="primary"
              class="p-0.5 rounded-lg [&_[data-reka-collection-item]]:min-h-[24px] [&_[data-reka-collection-item]]:px-2 [&_[data-reka-collection-item]]:py-0.5 [&_[data-reka-collection-item]]:text-[10px]"
              title="Choisir si la transformation cible le groupe entier ou le sprite"
            />
          </div>

          <!-- Contrôle de l'Échelle (Scale) & Drag Corner info -->
          <div class="flex items-center gap-1 pl-2 border-l border-border-subtle/60">
            <span class="text-[10px] text-text-muted">Échelle :</span>
            <IconButton
              icon="remove"
              size="xs"
              variant="secondary"
              class="w-5 h-5 rounded bg-bg-surface hover:bg-bg-surface-hover text-text-muted hover:text-text-primary border border-border-subtle flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              title="Réduire l'échelle (-0.05) [ou glissez un coin]"
              @click="adjustScale(-0.05)"
            />
            <span class="font-mono text-[10px] font-bold text-primary min-w-[38px] text-center">
              {{ currentScale.toFixed(2) }}×
            </span>
            <IconButton
              icon="add"
              size="xs"
              variant="secondary"
              class="w-5 h-5 rounded bg-bg-surface hover:bg-bg-surface-hover text-text-muted hover:text-text-primary border border-border-subtle flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              title="Augmenter l'échelle (+0.05) [ou glissez un coin]"
              @click="adjustScale(0.05)"
            />
            <Button
              v-if="currentScale !== 1"
              size="xs"
              variant="ghost"
              class="text-[9px] font-bold text-text-muted hover:text-text-primary px-1 py-0.5 rounded border border-border-subtle hover:bg-bg-surface-hover cursor-pointer ml-0.5"
              title="Rétablir l'échelle à 1.00×"
              @click="setExactScale(1)"
            >
              1:1
            </Button>
          </div>

          <!-- Dimensions et coordonnée en direct -->
          <span v-if="selectedBounds" class="text-[10px] text-text-muted font-mono pl-1 border-l border-border-subtle/60">
            {{ selectedBounds.width }}&times;{{ selectedBounds.height }}px
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
