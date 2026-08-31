<script setup lang="ts">
import { computed, ref } from 'vue'
import { ToolbarButton } from 'reka-ui'
import type { TourKey } from '@/features/project/services/tour-definitions'
import { Button } from '@/components/ui/button'
import { DropdownMenu, type DropdownMenuItemDef } from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'

const emit = defineEmits<{
  (event: 'startTour', key?: TourKey): void
}>()

const isOpen = ref(false)
const items = computed<DropdownMenuItemDef[]>(() => [
  {
    id: 'current-context-tour',
    label: 'Visite guidée du Studio',
    icon: 'help_center',
    onClick: () => emit('startTour', 'studio-overview')
  },
  { id: 'separator-tours', type: 'separator' },
  { id: 'tours-label', type: 'label', label: 'Toutes les visites' },
  {
    id: 'tour-studio',
    label: 'Studio & Viewport',
    icon: 'dashboard',
    onClick: () => emit('startTour', 'studio-overview')
  },
  {
    id: 'tour-rig',
    label: 'Calibrage de personnage',
    icon: 'accessibility_new',
    onClick: () => emit('startTour', 'rig-calibration')
  },
  {
    id: 'tour-snapshots',
    label: 'Vues sauvegardées',
    icon: 'collections_bookmark',
    onClick: () => emit('startTour', 'saved-snapshots')
  },
  {
    id: 'tour-export',
    label: 'Module d’exportation',
    icon: 'file_download',
    onClick: () => emit('startTour', 'export')
  }
])
</script>

<template>
  <DropdownMenu v-model:open="isOpen" :items="items" align="end">
    <template #trigger>
      <ToolbarButton as-child>
        <Button
          variant="ghost"
          size="xs"
          class="h-7 gap-1 px-2 text-[11px]"
          :class="isOpen ? 'bg-bg-surface-hover text-text-primary' : ''"
          title="Visites guidées et aide"
        >
          <Icon name="help" size="xs" />
        </Button>
      </ToolbarButton>
    </template>
  </DropdownMenu>
</template>
