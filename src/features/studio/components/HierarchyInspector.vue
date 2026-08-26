<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import type { TrackGroup, TrackGroupColor } from '@core/types/timeline.types'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import CreateGroupModal from '@/features/timeline/components/CreateGroupModal.vue'
import DeleteGroupDialog from '@/features/timeline/components/DeleteGroupDialog.vue'
import LayerSettingsModal from './LayerSettingsModal.vue'

const { activeLayers } = useHierarchyResolver()
const timelineStore = useTimelineStore()

const isCreateGroupOpen = ref(false)
const isDeleteGroupOpen = ref(false)
const groupToDelete = ref<TrackGroup | null>(null)
const isSettingsOpen = ref(false)
const settingsGroup = ref<TrackGroup | null>(null)
const settingsLayer = ref<RenderableLayer | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listRef')

const groups = computed(() => {
  const allGroups = timelineStore.currentSequence.groups || []
  return [...allGroups].sort((left, right) => right.zIndex - left.zIndex)
})

function getActiveLayersInGroup(groupId?: string): RenderableLayer[] {
  return activeLayers.value
    .filter((layer) => layer.groupId === groupId)
    .sort((left, right) => {
      if (left.trackZIndex !== right.trackZIndex) return right.trackZIndex - left.trackZIndex
      return right.spriteOrder - left.spriteOrder
    })
}

const ungroupedActiveLayers = computed(() => {
  const groupIds = new Set((timelineStore.currentSequence.groups || []).map((group) => group.id))
  return activeLayers.value.filter((layer) => !layer.groupId || !groupIds.has(layer.groupId))
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

function selectGroup(groupId: string) {
  timelineStore.selectGroupForEditing(groupId)
}

function selectLayer(layer: RenderableLayer) {
  timelineStore.selectSpriteForEditing(layer.trackId, layer.keyframeId, layer.spriteId)
}

function openGroupSettings(group: TrackGroup) {
  selectGroup(group.id)
  settingsGroup.value = group
  settingsLayer.value = null
  isSettingsOpen.value = true
}

function requestGroupDeletion(group: TrackGroup) {
  groupToDelete.value = group
  isDeleteGroupOpen.value = true
}

function openLayerSettings(layer: RenderableLayer) {
  selectLayer(layer)
  settingsGroup.value = null
  settingsLayer.value = layer
  isSettingsOpen.value = true
}

function removeLayer(layer: RenderableLayer) {
  if (!confirm(`Supprimer « ${layer.asset.name} » de cette keyframe ?`)) return
  timelineStore.removeKeyframeSprite(layer.trackId, layer.keyframeId, layer.spriteId)
}

watch(
  () => [
    timelineStore.selectedGroupId,
    timelineStore.selectedTrackId,
    timelineStore.selectedSpriteId
  ],
  async ([groupId, trackId, spriteId]) => {
    if (!groupId && !trackId) return
    if (groupId) timelineStore.setGroupCollapsed(groupId, false)
    await nextTick()

    const elements = listRef.value?.querySelectorAll<HTMLElement>('[data-selection-key]')
    const selectionKey = spriteId ? `sprite:${spriteId}` : groupId ? `group:${groupId}` : `track:${trackId}`
    const target = Array.from(elements ?? []).find(
      (element) => element.dataset.selectionKey === selectionKey
    )
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
)
</script>

<template>
  <div data-tour="hierarchy" class="w-full h-full border-l border-border-subtle bg-bg-surface/50 backdrop-blur-md flex flex-col select-none">
    <div class="h-10 border-b border-border-subtle px-3 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
        <Icon name="account_tree" size="xs" class="text-primary" />
        <span>Groupes & Calques</span>
      </div>

      <div class="flex items-center gap-2">
        <Button
          size="xs"
          variant="ghost"
          class="gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/30"
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

    <div ref="listRef" role="tree" class="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar">
      <section
        v-for="group in groups"
        :key="group.id"
        class="rounded-xl border border-border-subtle/80 bg-bg-surface/70 overflow-hidden shadow-xs"
      >
        <SelectableSurface
          :data-selection-key="`group:${group.id}`"
          class="px-2.5 py-2 bg-bg-surface-hover/50 flex items-center gap-1.5 cursor-pointer"
          density="compact"
          role="treeitem"
          :aria-expanded="!group.collapsed"
          :selected="timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'"
          :class="{
            'ring-1 ring-primary/40 bg-primary/10':
              timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'
          }"
          @click="selectGroup(group.id)"
        >
          <IconButton
            :icon="group.collapsed ? 'chevron_right' : 'expand_more'"
            size="xs"
            variant="ghost"
            :aria-label="group.collapsed ? `Déplier ${group.name}` : `Replier ${group.name}`"
            @click.stop="timelineStore.toggleGroupCollapse(group.id)"
          />
          <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="groupColorDots[group.color || 'indigo']" />
          <span class="font-bold text-xs text-text-primary truncate flex-1">{{ group.name }}</span>
          <Icon
            v-if="timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'"
            name="warning"
            size="xs"
            class="text-red-400 shrink-0"
            title="Attention : le groupe entier est sélectionné"
          />
          <Badge variant="neutral" size="sm" class="text-[9px] font-mono">
            {{ getActiveLayersInGroup(group.id).length }}
          </Badge>
          <IconButton
            icon="settings"
            size="xs"
            variant="ghost"
            :aria-label="`Configurer ${group.name}`"
            title="Configurer le groupe"
            @click.stop="openGroupSettings(group)"
          />
          <IconButton
            icon="delete"
            size="xs"
            variant="destructive"
            :aria-label="`Supprimer le groupe ${group.name}`"
            title="Supprimer le groupe"
            @click.stop="requestGroupDeletion(group)"
          />
        </SelectableSurface>

        <div v-if="!group.collapsed" role="group" class="p-1.5 space-y-1.5 border-t border-border-subtle/50">
          <SelectableSurface
            v-for="layer in getActiveLayersInGroup(group.id)"
            :key="layer.id"
            :data-selection-key="`sprite:${layer.spriteId}`"
            class="p-2 rounded-lg border text-xs cursor-pointer flex items-center gap-2"
            role="treeitem"
            :selected="timelineStore.selectedSpriteId === layer.spriteId && timelineStore.editScope === 'layer'"
            :class="[
              timelineStore.selectedSpriteId === layer.spriteId && timelineStore.editScope === 'layer'
                ? 'bg-primary/15 border-primary/50 ring-1 ring-primary/30 font-semibold'
                : 'bg-bg-surface/60 border-border-subtle/50 hover:bg-bg-surface-hover/80 hover:border-border-default'
            ]"
            @click="selectLayer(layer)"
          >
            <Icon
              :name="ASSET_CATEGORIES[layer.category]?.icon || 'layers'"
              size="xs"
              class="text-primary/90 shrink-0"
            />
            <span class="truncate flex-1 text-[11px] text-text-primary">{{ layer.asset.name }}</span>
            <Badge variant="neutral" size="sm" class="text-[8px] font-mono uppercase px-1 py-0">
              {{ layer.category }}
            </Badge>
            <IconButton
              icon="settings"
              size="xs"
              variant="ghost"
              :aria-label="`Configurer ${layer.asset.name}`"
              title="Configurer le sprite"
              @click.stop="openLayerSettings(layer)"
            />
            <IconButton
              icon="delete"
              size="xs"
              variant="ghost"
              class="text-text-muted hover:text-danger"
              :aria-label="`Supprimer ${layer.asset.name}`"
              title="Retirer ce sprite de la keyframe"
              @click.stop="removeLayer(layer)"
            />
          </SelectableSurface>

          <div
            v-if="getActiveLayersInGroup(group.id).length === 0"
            class="py-2 text-center text-[10px] text-text-muted italic"
          >
            Aucun calque actif à cet instant
          </div>
        </div>
      </section>

      <section
        v-if="ungroupedActiveLayers.length > 0"
        class="rounded-xl border border-border-subtle/80 bg-bg-surface/70 p-2 space-y-1.5"
      >
        <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Calques libres</span>
        <SelectableSurface
          v-for="layer in ungroupedActiveLayers"
          :key="layer.id"
          :data-selection-key="`sprite:${layer.spriteId}`"
          class="p-2 rounded-lg border border-border-subtle/50 bg-bg-surface/60 text-xs flex items-center gap-2 cursor-pointer"
          role="treeitem"
          :selected="timelineStore.selectedSpriteId === layer.spriteId"
          @click="selectLayer(layer)"
        >
          <span class="truncate flex-1">{{ layer.asset.name }}</span>
          <IconButton
            icon="settings"
            size="xs"
            variant="ghost"
            :aria-label="`Configurer ${layer.asset.name}`"
            @click.stop="openLayerSettings(layer)"
          />
          <IconButton
            icon="delete"
            size="xs"
            variant="ghost"
            class="text-text-muted hover:text-danger"
            :aria-label="`Supprimer ${layer.asset.name}`"
            @click.stop="removeLayer(layer)"
          />
        </SelectableSurface>
      </section>

      <EmptyState
        v-if="activeLayers.length === 0"
        icon="hourglass_empty"
        title="Aucun calque actif à cet instant"
        description="Déplacez la tête de lecture ou ajoutez des sprites."
        class="border-0 bg-transparent shadow-none p-8"
      />
    </div>

    <CreateGroupModal v-model:open="isCreateGroupOpen" />
    <DeleteGroupDialog
      v-model:open="isDeleteGroupOpen"
      :group="groupToDelete"
    />
    <LayerSettingsModal
      v-model:open="isSettingsOpen"
      :group="settingsGroup"
      :layer="settingsLayer"
    />
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
