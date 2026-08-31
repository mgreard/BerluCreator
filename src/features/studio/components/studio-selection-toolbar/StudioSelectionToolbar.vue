<script setup lang="ts">
import { ToolbarButton, ToolbarRoot, ToolbarSeparator } from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Popover } from '@/components/ui/popover'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
import { OpticalDepthControls, type OpticalDepthPreset } from '../optical-depth-controls'
import type { DeskPlacement, StudioSelectionToolbarProps } from './types'

defineProps<StudioSelectionToolbarProps>()

const emit = defineEmits<{
  (event: 'update:deskPlacement', value: DeskPlacement): void
  (event: 'update:opticalDepthOpen', open: boolean): void
  (event: 'update:opticalDepthPercent', value: number): void
  (event: 'update:opticalDepthPreset', value: OpticalDepthPreset): void
  (event: 'opticalDepthInteractionStart'): void
  (event: 'opticalDepthInteractionEnd'): void
  (event: 'resetOpticalDepth'): void
  (event: 'openDeskSplit'): void
  (event: 'flip'): void
  (event: 'delete'): void
  (event: 'clearSelection'): void
}>()

const deskPlacementOptions: SegmentOption[] = [
  { value: 'behind', label: 'Derrière', icon: 'flip_to_back' },
  { value: 'front', label: 'Devant', icon: 'flip_to_front' }
]
</script>

<template>
  <Teleport to="#studio-selection-overlay-host">
    <ToolbarRoot
      v-if="open"
      orientation="horizontal"
      aria-label="Outils du calque sélectionné"
      class="viewport-glass pointer-events-auto absolute bottom-3 left-1/2 flex max-w-[calc(100%-1rem)] -translate-x-1/2 items-center gap-2 overflow-hidden rounded-2xl border border-white/15 px-2 py-1.5 text-xs text-white/90 shadow-glass-xl transition-all duration-300 ease-out"
      data-tour="selection-tools"
      @pointerdown.stop
      @dblclick.stop
      @keydown.esc.stop="emit('clearSelection')"
    >
      <span class="flex min-w-0 items-center gap-1.5 font-semibold text-white/90">
        <Icon :name="layerIcon" size="xs" class="shrink-0 text-primary" />
        <span class="max-w-[150px] truncate">{{ layerName }}</span>
      </span>

      <ToolbarSeparator class="h-5 w-px shrink-0 bg-white/15" />

      <div v-if="canEditDeskPlacement" class="flex items-center gap-1.5">
        <span class="text-[10px] font-semibold text-white/60">Scène</span>
        <SegmentedControl
          :model-value="deskPlacement"
          :options="deskPlacementOptions"
          size="sm"
          variant="primary"
          class="border border-white/10 bg-black/30"
          aria-label="Position de l’accessoire par rapport au bureau et aux personnages"
          @update:model-value="emit('update:deskPlacement', $event as DeskPlacement)"
        />
        <ToolbarSeparator class="h-5 w-px shrink-0 bg-white/15" />
      </div>

      <Popover
        v-if="canEditOpticalDepth"
        :model-value="opticalDepthOpen"
        title="Distance caméra"
        description="Affecte le flou, jamais l’ordre des calques."
        width="lg"
        surface="glass"
        side="top"
        align="center"
        :side-offset="20"
        body-class="p-3 overflow-hidden"
        data-optical-depth-popover
        @update:model-value="emit('update:opticalDepthOpen', $event)"
      >
        <template #trigger>
          <ToolbarButton as-child>
            <IconButton
              icon="tune"
              size="xs"
              variant="ghost"
              class="viewport-action size-7"
              :active="opticalDepthOpen"
              aria-label="Régler la distance caméra du calque"
              title="Distance caméra (flou optique du calque)"
            />
          </ToolbarButton>
        </template>

        <OpticalDepthControls
          :model-value="opticalDepthPercent"
          :preset="opticalDepthPreset"
          :label="opticalDepthLabel"
          @update:model-value="emit('update:opticalDepthPercent', $event)"
          @update:preset="emit('update:opticalDepthPreset', $event)"
          @interaction-start="emit('opticalDepthInteractionStart')"
          @interaction-end="emit('opticalDepthInteractionEnd')"
          @reset="emit('resetOpticalDepth')"
        />
      </Popover>

      <ToolbarButton v-if="canEditDeskSplit" as-child>
        <IconButton
          icon="content_cut"
          size="xs"
          variant="ghost"
          class="viewport-action size-7 text-amber-400 hover:text-amber-300"
          :active="deskSplitOpen"
          aria-label="Découper la profondeur du meuble (2.5D)"
          title="Découper la profondeur du meuble (2.5D)"
          @click="emit('openDeskSplit')"
        />
      </ToolbarButton>

      <ToolbarButton as-child>
        <IconButton
          icon="flip"
          size="xs"
          variant="ghost"
          class="viewport-action size-7"
          :active="flipped"
          :aria-label="flipped ? 'Rétablir l’orientation' : 'Retourner horizontalement'"
          :title="flipped ? 'Rétablir l’orientation' : 'Retourner horizontalement'"
          @click="emit('flip')"
        />
      </ToolbarButton>

      <ToolbarButton as-child>
        <IconButton
          icon="delete"
          size="xs"
          variant="destructive"
          class="size-7"
          :aria-label="deleteLabel"
          :title="deleteLabel"
          @click="emit('delete')"
        />
      </ToolbarButton>

      <ToolbarButton as-child>
        <IconButton
          icon="close"
          size="xs"
          variant="ghost"
          class="viewport-action size-7 text-white/50 hover:text-white"
          title="Désélectionner"
          aria-label="Désélectionner"
          @click="emit('clearSelection')"
        />
      </ToolbarButton>
    </ToolbarRoot>
  </Teleport>
</template>
