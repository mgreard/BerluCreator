<script setup lang="ts">
import { ToolbarButton, ToolbarRoot, ToolbarSeparator } from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { SegmentedControl, type SegmentOption } from '@/components/ui/segmented-control'
import type { DeskPlacement, StudioSelectionToolbarProps } from './types'

const { blurEnabled = false, isBackground = false } = defineProps<StudioSelectionToolbarProps>()

const emit = defineEmits<{
  (event: 'update:deskPlacement', value: DeskPlacement): void
  (event: 'openDeskSplit'): void
  (event: 'toggleBlur'): void
  (event: 'flip'): void
  (event: 'delete'): void
  (event: 'clearSelection'): void
  (event: 'resetCover'): void
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
      class="viewport-glass pointer-events-auto absolute bottom-3 left-1/2 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 overflow-hidden rounded-full border border-white/12 bg-[#0e0e18]/90 px-3.5 py-1.5 text-xs text-white/90 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_24px_rgba(168,85,247,0.18)] transition-all duration-300 ease-out"
      data-tour="selection-tools"
      @pointerdown.stop
      @dblclick.stop
      @keydown.esc.stop="emit('clearSelection')"
    >
      <span class="flex min-w-0 items-center gap-1.5 font-semibold text-white/95 pl-1">
        <Icon :name="layerIcon" size="xs" class="shrink-0 text-amber-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" />
        <span class="max-w-[160px] truncate text-[11px] tracking-wide">{{ layerName }}</span>
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
          :icon="blurEnabled ? 'blur_on' : 'blur_off'"
          size="xs"
          variant="ghost"
          class="viewport-action size-7"
          :active="blurEnabled"
          :aria-label="
            blurEnabled
              ? 'Désactiver le flou (garder net)'
              : 'Activer le flou (soumis au flou du viewport)'
          "
          :title="
            blurEnabled
              ? 'Flou activé (l’item est affecté par le flou du viewport)'
              : 'Flou désactivé (l’item reste net)'
          "
          @click="emit('toggleBlur')"
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

      <ToolbarButton v-if="isBackground" as-child>
        <IconButton
          icon="fit_screen"
          size="xs"
          variant="ghost"
          class="viewport-action size-7 text-sky-400 hover:text-sky-300"
          aria-label="Recadrer en cover dans le viewport"
          title="Recadrer en cover dans le viewport"
          @click="emit('resetCover')"
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
