<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import type { TrackGroupColor } from '@core/types/timeline.types'
import CreateGroupModal from '@/features/timeline/components/CreateGroupModal.vue'

const { activeLayers } = useHierarchyResolver()
const timelineStore = useTimelineStore()

const isCreateGroupOpen = ref(false)

const groups = computed(() => {
  const allGroups = timelineStore.currentSequence.groups || []
  // Classer les groupes du premier plan vers le fond
  return [...allGroups].sort((a, b) => b.zIndex - a.zIndex)
})

function getActiveLayersInGroup(groupId?: string): RenderableLayer[] {
  return activeLayers.value
    .filter((l) => l.groupId === groupId)
    .sort((a, b) => b.trackZIndex - a.trackZIndex) // Premier plan vers arrière-plan
}

const ungroupedActiveLayers = computed(() => {
  const groupIds = new Set((timelineStore.currentSequence.groups || []).map((g) => g.id))
  return activeLayers.value
    .filter((l) => !l.groupId || !groupIds.has(l.groupId))
    .sort((a, b) => b.trackZIndex - a.trackZIndex)
})

const groupColorDots: Record<TrackGroupColor, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500'
}

function setTrackZIndex(trackId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const value = parseInt(input.value, 10)
  if (!isNaN(value)) {
    timelineStore.updateTrackZIndex(trackId, Math.max(0, Math.min(100, value)))
  }
}

function setGroupZIndex(groupId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const value = parseInt(input.value, 10)
  if (!isNaN(value)) {
    timelineStore.updateGroupZIndex(groupId, Math.max(0, Math.min(100, value)))
  }
}

function setGroupScale(groupId: string, event: Event) {
  const input = event.target as HTMLInputElement
  const value = parseFloat(input.value)
  if (!isNaN(value)) {
    const clamped = Number(Math.max(0.1, Math.min(4.0, value)).toFixed(2))
    timelineStore.updateGroupTransform(groupId, { scaleX: clamped, scaleY: clamped })
  }
}

function setLayerScale(layer: RenderableLayer, event: Event) {
  const input = event.target as HTMLInputElement
  const value = parseFloat(input.value)
  if (!isNaN(value) && layer.keyframeId) {
    const clamped = Number(Math.max(0.1, Math.min(4.0, value)).toFixed(2))
    timelineStore.updateKeyframeTransform(layer.trackId, layer.keyframeId, { scaleX: clamped, scaleY: clamped })
  }
}

function selectGroup(groupId: string) {
  timelineStore.selectGroupForEditing(groupId)
}

function selectLayer(layer: RenderableLayer) {
  timelineStore.selectTrackForEditing(layer.trackId)
}
</script>

<template>
  <div class="w-80 h-full border-l border-border-subtle bg-bg-surface/50 backdrop-blur-md flex flex-col select-none">
    <!-- En-tête de l'inspecteur -->
    <div class="h-10 border-b border-border-subtle px-3 flex items-center justify-between">
      <div class="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
        <Icon name="account_tree" size="xs" class="text-primary" />
        <span>Groupes & Calques</span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="xs"
          variant="ghost"
          class="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded border border-primary/30 transition-colors cursor-pointer"
          title="Créer un nouveau groupe"
          @click="isCreateGroupOpen = true"
        >
          <Icon name="create_new_folder" size="xs" />
          <span>+ Groupe</span>
        </Button>

        <Badge variant="neutral" size="sm" class="text-[10px] font-mono">
          {{ activeLayers.length }}
        </Badge>
      </div>
    </div>

    <!-- Liste hiérarchique : Groupes et leurs Calques -->
    <div class="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
      <div
        v-for="group in groups"
        :key="group.id"
        class="rounded-xl border border-border-subtle/80 bg-bg-surface/70 overflow-hidden shadow-xs"
      >
        <!-- En-tête du groupe avec Z-Index Global et Scale -->
        <SelectableSurface
          class="px-2.5 py-2 bg-bg-surface-hover/50 border-b border-border-subtle/60 flex items-center justify-between gap-1.5 cursor-pointer"
          density="compact"
          role="treeitem"
          :selected="timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'"
          :class="{
            'ring-1 ring-primary/40 bg-primary/10':
              timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'
          }"
          @click="selectGroup(group.id)"
        >
          <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="groupColorDots[group.color || 'indigo']" />
            <span class="font-bold text-xs text-text-primary truncate">{{ group.name }}</span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Contrôle Scale du Groupe -->
            <div class="flex items-center gap-1 bg-bg-base/90 px-1.5 py-0.5 rounded-md border border-border-subtle/80">
              <span class="text-text-muted font-bold text-[9px]">S:</span>
              <Input
                type="number"
                size="sm"
                step="0.05"
                min="0.1"
                max="4"
                :model-value="(group.transform?.scaleX ?? 1).toFixed(2)"
                class="w-11 min-h-[24px] rounded-md shadow-none text-accent font-mono font-bold [&_input]:px-1 [&_input]:py-0 [&_input]:text-center [&_input]:text-[11px]"
                title="Échelle du groupe"
                @click.stop
                @change="setGroupScale(group.id, $event)"
              />
            </div>

            <!-- Contrôle Z-Index Global du Groupe -->
            <div class="flex items-center gap-1 bg-bg-base/90 px-1.5 py-0.5 rounded-md border border-border-subtle/80">
              <span class="text-text-muted font-bold text-[9px]">Z-G:</span>
              <Input
                type="number"
                size="sm"
                :model-value="group.zIndex"
                class="w-10 min-h-[24px] rounded-md shadow-none text-primary font-mono font-bold [&_input]:px-1 [&_input]:py-0 [&_input]:text-center [&_input]:text-xs"
                min="0"
                max="100"
                title="Z-Index Global du groupe"
                @click.stop
                @change="setGroupZIndex(group.id, $event)"
              />
            </div>
          </div>
        </SelectableSurface>

        <!-- Calques actifs dans ce groupe -->
        <div class="p-1.5 space-y-1.5">
          <SelectableSurface
            v-for="layer in getActiveLayersInGroup(group.id)"
            :key="layer.trackId"
            class="p-2 rounded-lg border transition-all flex flex-col gap-1.5 text-xs cursor-pointer"
            role="treeitem"
            :selected="timelineStore.selectedTrackId === layer.trackId && timelineStore.editScope === 'layer'"
            :class="[
              timelineStore.selectedTrackId === layer.trackId && timelineStore.editScope === 'layer'
                ? 'bg-primary/15 border-primary/50 ring-1 ring-primary/30 font-semibold'
                : 'bg-bg-surface/60 border-border-subtle/50 hover:bg-bg-surface-hover/80 hover:border-border-default'
            ]"
            @click="selectLayer(layer)"
          >
            <div class="flex items-center justify-between gap-1">
              <span class="font-medium text-text-primary truncate flex items-center gap-1.5 text-[11px]">
                <Icon
                  :name="ASSET_CATEGORIES[layer.category]?.icon || 'layers'"
                  size="xs"
                  class="text-primary/90 shrink-0"
                />
                <span class="truncate">{{ layer.asset.name }}</span>
              </span>
              <Badge variant="neutral" size="sm" class="text-[8px] font-mono uppercase px-1 py-0">
                {{ layer.category }}
              </Badge>
            </div>

            <!-- Position, Rotation, Scale et Z-Index Local -->
            <div class="flex items-center justify-between text-text-muted text-[10px] font-mono pt-1 border-t border-border-subtle/40">
              <div class="flex items-center gap-1.5">
                <span>X:{{ Math.round(layer.x) }}</span>
                <span>Y:{{ Math.round(layer.y) }}</span>
                <span v-if="layer.rotation !== 0" class="text-amber-400">
                  {{ Math.round(layer.rotation) }}°
                </span>
              </div>

              <div class="flex items-center gap-1">
                <!-- Scale Local du Calque -->
                <div v-if="layer.keyframeId" class="flex items-center gap-0.5 bg-bg-base/80 px-1 py-0.5 rounded border border-border-subtle/70 shrink-0">
                  <span class="text-text-muted font-bold text-[9px]">S:</span>
                  <Input
                    type="number"
                    size="sm"
                    step="0.05"
                    min="0.1"
                    max="4"
                    :model-value="layer.localScaleX.toFixed(2)"
                    class="w-10 min-h-[24px] rounded shadow-none text-text-primary font-mono font-bold [&_input]:px-0.5 [&_input]:py-0 [&_input]:text-center [&_input]:text-[10px]"
                    title="Échelle du calque"
                    @click.stop
                    @change="setLayerScale(layer, $event)"
                  />
                </div>

                <!-- Contrôle Z-Index Local -->
                <div class="flex items-center gap-0.5 bg-bg-base/80 px-1 py-0.5 rounded border border-border-subtle/70 shrink-0">
                  <span class="text-text-muted font-bold text-[9px]">Z:</span>
                  <Input
                    type="number"
                    size="sm"
                    :model-value="layer.trackZIndex"
                    class="w-9 min-h-[24px] rounded shadow-none text-text-primary font-mono font-bold [&_input]:px-0.5 [&_input]:py-0 [&_input]:text-center [&_input]:text-[10px]"
                    min="0"
                    max="100"
                    title="Z-Index Local"
                    @click.stop
                    @change="setTrackZIndex(layer.trackId, $event)"
                  />
                </div>
              </div>
            </div>
          </SelectableSurface>

          <!-- Si aucun calque actif dans ce groupe -->
          <div
            v-if="getActiveLayersInGroup(group.id).length === 0"
            class="py-2 text-center text-[10px] text-text-muted italic"
          >
            Aucun calque actif dans ce groupe
          </div>
        </div>
      </div>

      <!-- Calques non groupés -->
      <div
        v-if="ungroupedActiveLayers.length > 0"
        class="rounded-xl border border-border-subtle/80 bg-bg-surface/70 p-2 space-y-1.5"
      >
        <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Calques Libres</span>
        <SelectableSurface
          v-for="layer in ungroupedActiveLayers"
          :key="layer.trackId"
          class="p-2 rounded-lg border border-border-subtle/50 bg-bg-surface/60 text-xs flex items-center justify-between cursor-pointer"
          density="compact"
          role="treeitem"
          :selected="timelineStore.selectedTrackId === layer.trackId && timelineStore.editScope === 'layer'"
          :class="{
            'bg-primary/15 border-primary':
              timelineStore.selectedTrackId === layer.trackId && timelineStore.editScope === 'layer'
          }"
          @click="selectLayer(layer)"
        >
          <span class="truncate text-[11px]">{{ layer.asset.name }}</span>
          <span class="text-[10px] font-mono text-text-muted">Z:{{ layer.zIndex }}</span>
        </SelectableSurface>
      </div>

      <!-- État vide global -->
      <EmptyState
        v-if="activeLayers.length === 0"
        icon="hourglass_empty"
        title="Aucun calque actif à cet instant"
        description="Déplacez la tête de lecture ou ajoutez des sprites."
        class="border-0 bg-transparent shadow-none p-8"
      />
    </div>

    <!-- Modale de Création de Groupe -->
    <CreateGroupModal v-model:open="isCreateGroupOpen" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
}
</style>
