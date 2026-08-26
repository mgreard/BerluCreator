<script setup lang="ts">
import { ref, useTemplateRef, computed, onMounted, onUnmounted } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'
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
import { Separator } from '@/components/ui/separator'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()
const showHierarchy = defineModel<boolean>('showHierarchy', { default: true })
const showAssets = defineModel<boolean>('showAssets', { default: true })

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()

// Mode d'édition : 'group' (déplace/scale tout le groupe) vs 'layer' (ouvre le groupe pour positionner/scaler ce sprite spécifique)
const editScope = computed({
  get: () => timelineStore.editScope,
  set: (scope: 'group' | 'layer') => {
    if (scope === 'group' && activeSelectedGroup.value) {
      timelineStore.selectGroupForEditing(activeSelectedGroup.value.id)
    } else if (scope === 'layer' && activeSelectedLayer.value) {
      timelineStore.selectSpriteForEditing(
        activeSelectedLayer.value.trackId,
        activeSelectedLayer.value.keyframeId,
        activeSelectedLayer.value.spriteId
      )
    }
  }
})

const editScopeOptions: SegmentOption[] = [
  { value: 'group', label: 'Groupe entier', icon: 'workspaces' },
  { value: 'layer', label: 'Ouvrir groupe', icon: 'crop_free' }
]

const selectedTrackId = computed(() => timelineStore.selectedTrackId)

const activeSelectedLayer = computed(() => {
  if (timelineStore.selectedSpriteId) {
    const selectedSpriteLayer = activeLayers.value.find(
      (layer) => layer.spriteId === timelineStore.selectedSpriteId
    )
    if (selectedSpriteLayer) return selectedSpriteLayer
  }

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
    const scaleX = activeSelectedGroup.value.transform?.scaleX ?? 1
    const scaleY = activeSelectedGroup.value.transform?.scaleY ?? 1
    return `Groupe : ${activeSelectedGroup.value.name} (X ${scaleX.toFixed(2)}× · Y ${scaleY.toFixed(2)}×)`
  }
  const l = activeSelectedLayer.value
  return `${l.trackName || l.asset.name} (X ${l.scaleX.toFixed(2)}× · Y ${l.scaleY.toFixed(2)}×)`
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
    timelineStore.undoLastTransform()
  }
}

function redoCanvasTransform() {
  if (!isDragging.value && !isResizing.value) {
    timelineStore.redoLastTransform()
  }
}

function toggleGrid() {
  projectStore.updateStage({ showGrid: !stage.value.showGrid })
}

function toggleSafeArea() {
  projectStore.updateStage({ safeArea: !stage.value.safeArea })
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
  if (event.key === 'Escape' && timelineStore.hasActiveTransformSession) {
    event.preventDefault()
    timelineStore.cancelTransformSession()
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

function clampScale(value: number) {
  return Number(Math.max(0.05, Math.min(5, value)).toFixed(2))
}

function applyScaleAxes(newScaleX: number, newScaleY: number) {
  const clampedX = clampScale(newScaleX)
  const clampedY = clampScale(newScaleY)

  if (isGroupTarget.value && activeSelectedGroup.value) {
    timelineStore.updateGroupTransform(activeSelectedGroup.value.id, {
      scaleX: clampedX,
      scaleY: clampedY
    })
  } else if (activeSelectedLayer.value?.keyframeId) {
    timelineStore.updateKeyframeSpriteTransform(
      activeSelectedLayer.value.trackId,
      activeSelectedLayer.value.keyframeId,
      activeSelectedLayer.value.spriteId,
      {
        scaleX: clampedX,
        scaleY: clampedY
      }
    )
  }
}

function adjustScale(delta: number) {
  applyScaleAxes(currentScaleX.value + delta, currentScaleY.value + delta)
}

function setExactScale(value: number) {
  applyScaleAxes(value, value)
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

  // 1. Priorité 1 : clic sur l'une des 8 poignées de redimensionnement.
  if (selectedBounds.value) {
    const hitHandle = hitTestResizeHandle(pos, selectedBounds.value)
    if (hitHandle) {
      isResizing.value = true
      activeHandle.value = hitHandle
      dragStartPointer.value = { ...pos }
      dragStartBounds.value = { ...selectedBounds.value }
      dragStartScale.value = { x: currentScaleX.value, y: currentScaleY.value }

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    }

    // 2. Priorité 2 : Clic à l'intérieur de la boîte de sélection active (Déplacement direct)
    const b = selectedBounds.value
    if (pos.x >= b.x && pos.x <= b.x + b.width && pos.y >= b.y && pos.y <= b.y + b.height) {
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
      timelineStore.selectSpriteForEditing(hit.trackId, hit.keyframeId, hit.spriteId)
    }
    assetStore.selectAsset(hit.asset.id)

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
    // Une session reste active jusqu'à validation explicite par OK ou annulation par Escape.
    if (!timelineStore.hasActiveTransformSession) timelineStore.clearStudioSelection(false)
  }
}

function onCanvasPointerMove(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // A. Les coins conservent le ratio ; les poignées latérales ciblent un axe.
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
      // Déplacement solidaire du groupe complet
      const newGroupX = Math.round(dragStartGroupPos.value.x + dx)
      const newGroupY = Math.round(dragStartGroupPos.value.y + dy)
      timelineStore.updateGroupTransform(activeSelectedGroup.value.id, { x: newGroupX, y: newGroupY })
    } else if (activeSelectedLayer.value?.keyframeId) {
      // Déplacement de l'élément individuel (coordonnées locales dans le groupe)
      const newX = Math.round(dragStartLayerPos.value.x + dx)
      const newY = Math.round(dragStartLayerPos.value.y + dy)
      timelineStore.updateKeyframeSpriteTransform(
        activeSelectedLayer.value.trackId,
        activeSelectedLayer.value.keyframeId,
        activeSelectedLayer.value.spriteId,
        { x: newX, y: newY }
      )
    }
    return
  }

  // C. Survol (Hover Cursor Tracking)
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
      timelineStore.selectSpriteForEditing(hit.trackId, hit.keyframeId, hit.spriteId)
    } else {
      timelineStore.selectGroupForEditing(hit.groupId)
    }
    assetStore.selectAsset(hit.asset.id)
  } else if (!hit && !timelineStore.hasActiveTransformSession) {
    timelineStore.clearStudioSelection(false)
  }
}
</script>

<template>
  <div class="relative flex items-center justify-center w-full h-full overflow-hidden p-4 select-none">
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

      <div
        class="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-xl border border-border-default bg-bg-elevated/95 p-1 shadow-glass-md backdrop-blur-md"
        @pointerdown.stop
        @dblclick.stop
      >
        <Badge variant="neutral" size="sm" class="font-mono text-[10px] mx-1">
          {{ stage.width }} × {{ stage.height }}
        </Badge>
        <Separator orientation="vertical" variant="subtle" class="h-4 mx-0.5" />
        <IconButton
          :icon="stage.showGrid ? 'grid_on' : 'grid_off'"
          size="xs"
          variant="ghost"
          :active="stage.showGrid"
          aria-label="Afficher ou masquer la grille"
          title="Afficher/Masquer la grille"
          @click="toggleGrid"
        />
        <IconButton
          :icon="stage.safeArea ? 'crop_free' : 'crop'"
          size="xs"
          variant="ghost"
          :active="stage.safeArea"
          aria-label="Afficher ou masquer la safe-area"
          title="Afficher/Masquer la Safe-Area TV"
          @click="toggleSafeArea"
        />
        <IconButton
          icon="photo_library"
          size="xs"
          variant="ghost"
          :active="showAssets"
          aria-label="Afficher ou masquer la bibliothèque d’assets"
          title="Afficher/Masquer la bibliothèque d’assets"
          @click="showAssets = !showAssets"
        />
        <IconButton
          icon="account_tree"
          size="xs"
          variant="ghost"
          :active="showHierarchy"
          aria-label="Afficher ou masquer la hiérarchie"
          title="Afficher/Masquer la hiérarchie"
          @click="showHierarchy = !showHierarchy"
        />
        <Separator orientation="vertical" variant="subtle" class="h-4 mx-0.5" />
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
        <Button
          v-if="timelineStore.hasActiveTransformSession"
          size="xs"
          variant="primary"
          class="ml-1 gap-1 font-bold"
          title="Valider toutes les modifications depuis le focus"
          @click="timelineStore.commitTransformSession()"
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
            <span class="font-mono text-[10px] font-bold text-primary min-w-[82px] text-center">
              X {{ currentScaleX.toFixed(2) }}× · Y {{ currentScaleY.toFixed(2) }}×
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

          <!-- Dimensions et coordonnée en direct -->
          <span v-if="selectedBounds" class="text-[10px] text-text-muted font-mono pl-1 border-l border-border-subtle/60">
            {{ selectedBounds.width }}&times;{{ selectedBounds.height }}px
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
