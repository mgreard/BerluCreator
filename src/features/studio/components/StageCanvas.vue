<script setup lang="ts">
import { ref, useTemplateRef, computed } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { useCanvasRenderer } from '../composables/useCanvasRenderer'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()

const stage = computed(() => projectStore.currentProject.stage)
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const { activeLayers } = useHierarchyResolver()

const selectedTrackId = computed(() => timelineStore.selectedTrackId)
useCanvasRenderer(canvasRef, activeLayers, stage, selectedTrackId)

const isDragging = ref(false)
const dragMode = ref<'group' | 'layer'>('group')
const draggedLayer = ref<RenderableLayer | null>(null)
const draggedGroupId = ref<string | null>(null)
const dragStartPointer = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartLayerPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const dragStartGroupPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const hoveredLayer = ref<RenderableLayer | null>(null)

const activeSelectedLayer = computed(() => {
  if (!timelineStore.selectedTrackId) return null
  return activeLayers.value.find((l) => l.trackId === timelineStore.selectedTrackId) ?? null
})

const activeSelectedGroup = computed(() => {
  if (!activeSelectedLayer.value?.groupId) return null
  return timelineStore.currentSequence.groups?.find((g) => g.id === activeSelectedLayer.value?.groupId) ?? null
})

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

function hitTestLayer(pos: { x: number; y: number }): RenderableLayer | null {
  const reversed = [...activeLayers.value].reverse()

  // 1. Priorité absolue aux calques déplaçables (Accessoires, objets, éléments libres)
  for (const layer of reversed) {
    if (!layer.isMovable) continue
    if (
      pos.x >= layer.x &&
      pos.x <= layer.x + layer.width &&
      pos.y >= layer.y &&
      pos.y <= layer.y + layer.height
    ) {
      return layer
    }
  }

  // 2. Calques anatomiques ou de scène non-plein écran (tête, torse, bras...)
  for (const layer of reversed) {
    // Ignorer les calques de fond ou d'ambiance plein écran non déplaçables pour ne pas bloquer les clics
    const isFullScreenBg =
      layer.category === 'backdrop' ||
      (layer.category === 'overlay' && !layer.isMovable) ||
      (layer.width >= stage.value.width * 0.95 && layer.height >= stage.value.height * 0.95 && !layer.isMovable)

    if (isFullScreenBg) continue

    if (
      pos.x >= layer.x &&
      pos.x <= layer.x + layer.width &&
      pos.y >= layer.y &&
      pos.y <= layer.y + layer.height
    ) {
      return layer
    }
  }

  return null
}

function onCanvasPointerDown(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  // Si un calque est DÉJÀ sélectionné et qu'on clique dans son périmètre, démarrer le drag
  if (activeSelectedLayer.value) {
    const sel = activeSelectedLayer.value
    const isInsideSelected =
      pos.x >= sel.x &&
      pos.x <= sel.x + sel.width &&
      pos.y >= sel.y &&
      pos.y <= sel.y + sel.height

    if (isInsideSelected) {
      isDragging.value = true
      draggedLayer.value = sel
      dragStartPointer.value = { ...pos }

      if (dragMode.value === 'group' && sel.groupId) {
        draggedGroupId.value = sel.groupId
        const grp = timelineStore.currentSequence.groups?.find((g) => g.id === sel.groupId)
        dragStartGroupPos.value = { x: grp?.transform?.x ?? 0, y: grp?.transform?.y ?? 0 }
      } else {
        draggedGroupId.value = null
        dragStartLayerPos.value = { x: sel.x, y: sel.y }
      }

      const target = e.currentTarget as HTMLElement
      target?.setPointerCapture?.(e.pointerId)
      return
    }
  }

  const hit = hitTestLayer(pos)
  if (hit) {
    timelineStore.selectedTrackId = hit.trackId
    timelineStore.selectedGroupId = hit.groupId ?? null
    assetStore.selectAsset(hit.asset.id)

    isDragging.value = true
    draggedLayer.value = hit
    dragStartPointer.value = { ...pos }

    if (dragMode.value === 'group' && hit.groupId) {
      draggedGroupId.value = hit.groupId
      const grp = timelineStore.currentSequence.groups?.find((g) => g.id === hit.groupId)
      dragStartGroupPos.value = { x: grp?.transform?.x ?? 0, y: grp?.transform?.y ?? 0 }
    } else {
      draggedGroupId.value = null
      dragStartLayerPos.value = { x: hit.x, y: hit.y }
    }

    const target = e.currentTarget as HTMLElement
    target?.setPointerCapture?.(e.pointerId)
  } else {
    timelineStore.selectedTrackId = null
    timelineStore.selectedGroupId = null
  }
}

function onCanvasPointerMove(e: PointerEvent) {
  const pos = getStageCoordinates(e)
  if (!pos) return

  if (isDragging.value && draggedLayer.value) {
    const dx = pos.x - dragStartPointer.value.x
    const dy = pos.y - dragStartPointer.value.y

    if (draggedGroupId.value) {
      // Déplacement solidaire du groupe complet (tête, corps, bras, etc.)
      const newGroupX = Math.round(dragStartGroupPos.value.x + dx)
      const newGroupY = Math.round(dragStartGroupPos.value.y + dy)
      timelineStore.updateGroupTransform(draggedGroupId.value, { x: newGroupX, y: newGroupY })
    } else if (draggedLayer.value.keyframeId) {
      // Déplacement de l'élément individuel
      const newX = Math.round(dragStartLayerPos.value.x + dx)
      const newY = Math.round(dragStartLayerPos.value.y + dy)
      timelineStore.updateKeyframeTransform(
        draggedLayer.value.trackId,
        draggedLayer.value.keyframeId,
        { x: newX, y: newY }
      )
    }
  } else {
    hoveredLayer.value = hitTestLayer(pos)
  }
}

function onCanvasPointerUp(e: PointerEvent) {
  if (isDragging.value) {
    isDragging.value = false
    draggedLayer.value = null
    draggedGroupId.value = null
    const target = e.currentTarget as HTMLElement
    if (target?.hasPointerCapture?.(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }
  }
}
</script>

<template>
  <div class="relative flex items-center justify-center w-full h-full overflow-hidden p-4 select-none">
    <div
      class="relative shadow-glass-2xl rounded-xl overflow-hidden border transition-all duration-200 bg-black/90 border-border-subtle/80 ring-1 ring-white/5"
      :class="[
        isDragging
          ? 'cursor-grabbing'
          : hoveredLayer?.isMovable || hoveredLayer?.groupId
            ? 'cursor-grab'
            : hoveredLayer
              ? 'cursor-pointer'
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
    >
      <canvas
        ref="canvas"
        :width="stage.width"
        :height="stage.height"
        class="w-full h-full object-contain block pointer-events-none"
      />

      <!-- HUD contextuel sur l'élément et groupe sélectionnés -->
      <div
        v-if="activeSelectedLayer"
        class="absolute bottom-3 left-3 flex items-center gap-2 pointer-events-auto animate-in fade-in duration-200"
      >
        <div class="px-3 py-1.5 rounded-xl bg-bg-elevated/95 backdrop-blur-md border border-border-default shadow-glass-md flex items-center gap-3 text-xs">
          <!-- Nom & Icône du calque -->
          <span class="font-semibold text-text-primary flex items-center gap-1.5">
            <Icon
              :name="ASSET_CATEGORIES[activeSelectedLayer.category]?.icon || 'layers'"
              size="xs"
              class="text-primary"
            />
            <span>{{ activeSelectedLayer.asset.name }}</span>
          </span>

          <!-- Groupe parent -->
          <div v-if="activeSelectedGroup" class="flex items-center gap-1 pl-2 border-l border-border-subtle/60">
            <span class="text-[10px] text-text-muted">Groupe:</span>
            <Badge variant="accent" size="sm" class="text-[9px] font-medium">
              {{ activeSelectedGroup.name }} (Z-G:{{ activeSelectedGroup.zIndex }})
            </Badge>
          </div>

          <!-- Bascule Mode Déplacement Groupe vs Élément -->
          <button
            v-if="activeSelectedLayer.groupId"
            type="button"
            class="px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            :class="[
              dragMode === 'group'
                ? 'bg-primary text-text-inverse border-primary shadow-glow-xs'
                : 'bg-bg-surface text-text-muted hover:text-text-primary border-border-default'
            ]"
            :title="dragMode === 'group' ? 'Le déplacement à la souris bouge tout le groupe solidaire' : 'Le déplacement bouge uniquement cet élément'"
            @click="dragMode = dragMode === 'group' ? 'layer' : 'group'"
          >
            <Icon :name="dragMode === 'group' ? 'workspaces' : 'near_me'" size="xs" />
            <span>{{ dragMode === 'group' ? 'Déplacer Groupe' : 'Déplacer Seul' }}</span>
          </button>

          <!-- Coordonnées et Z-Index Local -->
          <span class="text-[10px] text-text-muted font-mono pl-1 border-l border-border-subtle/60">
            X:{{ Math.round(activeSelectedLayer.x) }} Y:{{ Math.round(activeSelectedLayer.y) }} Z-Loc:{{ activeSelectedLayer.trackZIndex }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
