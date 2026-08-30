<script setup lang="ts">
import { ToolbarButton, ToolbarRoot, ToolbarSeparator } from 'reka-ui'
import type { CameraFrame, DepthOfFieldSettings } from '@core/types/editor.types'
import type { TourKey } from '@/features/project/services/tour-definitions'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Popover } from '@/components/ui/popover'
import StudioTourMenu from './StudioTourMenu.vue'

const {
  activeCamera = { enabled: false, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
  depthOfField = { enabled: false, focusY: 0.5, feather: 100, blurRadius: 8 },
  hasVisualEffects = false,
  isSavedSnapshotsOpen = false,
  isVisualEffectsOpen = false,
  isDepthOfFieldEditorOpen = false,
  canUndo = false,
  canRedo = false
} = defineProps<{
  activeCamera?: CameraFrame
  depthOfField?: DepthOfFieldSettings
  hasVisualEffects?: boolean
  isSavedSnapshotsOpen?: boolean
  isVisualEffectsOpen?: boolean
  isDepthOfFieldEditorOpen?: boolean
  canUndo?: boolean
  canRedo?: boolean
}>()

const emit = defineEmits<{
  (event: 'openExport'): void
  (event: 'toggleSavedSnapshots'): void
  (event: 'updateVisualEffectsOpen', open: boolean): void
  (event: 'updateDepthOfFieldEditorOpen', open: boolean): void
  (event: 'toggleCameraFrame'): void
  (event: 'undo'): void
  (event: 'redo'): void
  (event: 'startTour', key?: TourKey): void
}>()

defineSlots<{
  visualEffects(): unknown
  depthOfField(): unknown
}>()
</script>

<template>
  <ToolbarRoot
    class="viewport-glass absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-nowrap items-center gap-1 rounded-xl border border-white/15 px-1.5 py-1 text-white/90 shadow-glass-xl pointer-events-auto select-none max-w-[calc(100%-1.5rem)] whitespace-nowrap overflow-x-auto scrollbar-none transition-all duration-300 ease-out"
    data-tour="viewport-top-actions"
    aria-label="Actions globales du studio"
    orientation="horizontal"
    @pointerdown.stop
    @dblclick.stop
  >
    <div class="flex shrink-0 items-center gap-1">

      <div class="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/15 bg-black/25 p-0.5">
        <ToolbarButton as-child>
          <IconButton icon="undo" size="sm" variant="ghost" class="viewport-action size-8" aria-label="Annuler la dernière action (Ctrl+Z)" title="Annuler (Ctrl+Z)" :disabled="!canUndo" @click="emit('undo')" />
        </ToolbarButton>
        <ToolbarButton as-child>
          <IconButton icon="redo" size="sm" variant="ghost" class="viewport-action size-8" aria-label="Rétablir la dernière action (Ctrl+Shift+Z)" title="Rétablir (Ctrl+Shift+Z)" :disabled="!canRedo" @click="emit('redo')" />
        </ToolbarButton>
      </div>

      <ToolbarSeparator class="mx-1 h-5 w-px shrink-0 bg-white/15" />

      <Popover
        :model-value="isDepthOfFieldEditorOpen"
        title="Profondeur de champ"
        description="Plans lointains et proches"
        width="w-72 max-w-[calc(100vw-2rem)]"
        surface="glass"
        align="center"
        :side-offset="10"
        body-class="p-3"
        ignore-outside-interaction-selector="[data-depth-overlay]"
        @update:model-value="emit('updateDepthOfFieldEditorOpen', $event)"
      >
        <template #trigger>
          <ToolbarButton as-child>
            <Button
              variant="ghost"
              size="xs"
              class="h-7 gap-1 px-2 text-[11px] font-medium transition-all duration-300 ease-out"
              :class="(depthOfField.enabled || isDepthOfFieldEditorOpen) ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
              title="Ouvrir les réglages du flou de profondeur"
            >
              <Icon name="blur_on" size="xs" :class="depthOfField.enabled ? 'text-cyan-400' : 'text-primary'" />
              <span>Flou</span>
              <span v-if="depthOfField.enabled" class="size-1.5 rounded-full bg-cyan-400" />
            </Button>
          </ToolbarButton>
        </template>
        <slot name="depthOfField" />
      </Popover>

      <Popover
        :model-value="isVisualEffectsOpen"
        title="Effets visuels"
        description="Colorimétrie et effets stylisés"
        width="lg"
        surface="glass"
        align="start"
        :side-offset="10"
        body-class="p-3"
        @update:model-value="emit('updateVisualEffectsOpen', $event)"
      >
        <template #trigger>
          <ToolbarButton as-child>
            <Button
              data-tour="visual-effects"
              variant="ghost"
              size="xs"
              class="h-7 gap-1 px-2 text-[11px] font-medium transition-all duration-300 ease-out"
              :class="(hasVisualEffects || isVisualEffectsOpen) ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
              title="Ouvrir le panneau des effets visuels"
            >
              <Icon name="auto_fix_high" size="xs" :class="hasVisualEffects ? 'text-amber-400' : 'text-primary'" />
              <span>Effets</span>
              <span v-if="hasVisualEffects" class="size-1.5 rounded-full bg-amber-400" />
            </Button>
          </ToolbarButton>
        </template>
        <slot name="visualEffects" />
      </Popover>

      <ToolbarButton as-child>
        <Button
          variant="ghost"
          size="xs"
          class="h-7 gap-1 px-2 text-[11px] font-medium transition-colors"
          :class="activeCamera.enabled ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
          title="Activer/Désactiver le cadrage caméra"
          @click="emit('toggleCameraFrame')"
        >
          <Icon name="crop_free" size="xs" class="text-primary" />
          <span>Cadrage</span>
        </Button>
      </ToolbarButton>


    </div>

    <ToolbarSeparator class="mx-1 h-5 w-px shrink-0 bg-white/15" />


    <div class="flex shrink-0 items-center gap-1.5">
      <ToolbarButton as-child>
        <Button
          data-tour="saved-snapshots-btn"
          variant="ghost"
          size="xs"
          class="h-7 gap-1 px-2 text-[11px] font-medium transition-colors"
          :class="isSavedSnapshotsOpen ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
          title="Ouvrir le panneau des compositions sauvegardées"
          @click="emit('toggleSavedSnapshots')"
        >
          <Icon name="collections_bookmark" size="xs" class="text-primary" />
          <span>Vues</span>
        </Button>
      </ToolbarButton>
      <ToolbarButton as-child>
        <Button
          data-tour="export-btn"
          variant="primary"
          size="xs"
          class="h-7 gap-1 px-2.5 text-xs font-semibold shadow-sm"
          title="Exporter l'image finale (PNG / WebP 4K)"
          @click="emit('openExport')"
        >
          <Icon name="file_download" size="xs" />
          <span>Exporter</span>
        </Button>
      </ToolbarButton>
      <StudioTourMenu @start-tour="emit('startTour', $event)" />
    </div>
  </ToolbarRoot>
</template>
