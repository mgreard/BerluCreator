<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, type DropdownMenuItemDef } from '@/components/ui/dropdown-menu'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import type { TimelineTrack, TrackGroup, TrackGroupColor } from '@core/types/timeline.types'
import type { AssetCategory } from '@core/types/asset.types'
import CreateGroupModal from './CreateGroupModal.vue'
import DeleteGroupDialog from './DeleteGroupDialog.vue'

const emit = defineEmits<{
  (e: 'scroll', event: Event): void
}>()

const timelineStore = useTimelineStore()
const listRef = useTemplateRef<HTMLDivElement>('listRef')

defineExpose({
  listRef
})

const isCreateGroupOpen = ref(false)
const isDeleteGroupOpen = ref(false)
const groupToDelete = ref<TrackGroup | null>(null)

function requestGroupDeletion(group: TrackGroup) {
  groupToDelete.value = group
  isDeleteGroupOpen.value = true
}

const groups = computed(() => (timelineStore.currentSequence.groups || []).filter(
  (group) => !group.isDefault || timelineStore.currentSequence.tracks.some(
    (track) => track.groupId === group.id && track.keyframes.some((keyframe) => keyframe.sprites.length > 0)
  )
))

function getTracksByGroup(groupId?: string): TimelineTrack[] {
  return timelineStore.currentSequence.tracks.filter((t) => t.groupId === groupId)
}

const ungroupedTracks = computed(() => {
  const groupIds = new Set(groups.value.map((g) => g.id))
  return timelineStore.currentSequence.tracks.filter((t) => !t.groupId || !groupIds.has(t.groupId))
})

const groupColorClasses: Record<TrackGroupColor, { border: string; text: string; bg: string; dot: string }> = {
  indigo: { border: 'border-l-indigo-500', text: 'text-indigo-400', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500' },
  emerald: { border: 'border-l-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500' },
  amber: { border: 'border-l-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-500' },
  rose: { border: 'border-l-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10', dot: 'bg-rose-500' },
  blue: { border: 'border-l-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10', dot: 'bg-blue-500' },
  purple: { border: 'border-l-purple-500', text: 'text-purple-400', bg: 'bg-purple-500/10', dot: 'bg-purple-500' },
  cyan: { border: 'border-l-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10', dot: 'bg-cyan-500' }
}

const MULTI_TRACK_CATEGORIES: AssetCategory[] = [
  'props_host',
  'props_set',
  'props_desk',
  'foreground'
]

function createAddTrackItems(groupId?: string): DropdownMenuItemDef[] {
  return MULTI_TRACK_CATEGORIES.map((category) => {
    const definition = ASSET_CATEGORIES[category]
    return {
      id: `add_track_${category}`,
      label: `Ajouter ${definition.label}`,
      icon: definition.icon,
      onClick: () => timelineStore.addTrack(category, undefined, undefined, groupId)
    }
  })
}

function getGroupMenuItems(group: TrackGroup): DropdownMenuItemDef[] {
  const items = createAddTrackItems(group.id)

  if (!group.isDefault) {
    items.push({
      id: 'sep_del',
      label: '---',
      icon: 'delete'
    })
    items.push({
      id: 'del_group',
      label: 'Supprimer le groupe',
      icon: 'delete',
      onClick: () => requestGroupDeletion(group)
    })
  }

  return items
}

const addTrackGlobalMenuItems: DropdownMenuItemDef[] = [
  {
    id: 'new_group',
    label: 'Nouveau Groupe de Pistes',
    icon: 'create_new_folder',
    onClick: () => {
      isCreateGroupOpen.value = true
    }
  },
  {
    id: 'sep_track',
    label: '---',
    icon: 'add'
  },
  ...createAddTrackItems()
]

function canRemoveTrack(track: TimelineTrack): boolean {
  const catDef = ASSET_CATEGORIES[track.category]
  if (catDef && catDef.trackCardinality === 'multi') {
    return true
  }
  const sameCatCount = timelineStore.currentSequence.tracks.filter((t) => t.category === track.category).length
  return sameCatCount > 1
}

function categoryRowStyle(category: AssetCategory) {
  const color = ASSET_CATEGORIES[category].color
  return {
    '--category-color': color,
    backgroundColor: `color-mix(in srgb, ${color} 8%, var(--color-bg-surface))`
  }
}
</script>

<template>
  <div class="w-72 border-r border-border-subtle bg-bg-surface/60 backdrop-blur-md flex flex-col shrink-0 select-none">
    <!-- En-tête fixe aligné avec la règle temporelle -->
    <div class="h-10 border-b border-border-subtle px-2.5 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider bg-bg-surface/80">
      <span>Groupes & Pistes</span>
      <div class="flex items-center gap-1.5">
        <!-- Bouton Création Rapide de Groupe -->
        <Button
          size="xs"
          variant="ghost"
          class="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-1.5 py-0.5 rounded border border-primary/30 transition-colors cursor-pointer"
          title="Créer un nouveau groupe de pistes (ex: Personnage 2, Bureau...)"
          @click="isCreateGroupOpen = true"
        >
          <Icon name="create_new_folder" size="xs" />
          <span>+ Groupe</span>
        </Button>

        <DropdownMenu
          :items="addTrackGlobalMenuItems"
          align="end"
          surface="glass"
          width="md"
        >
          <IconButton
            icon="add"
            size="xs"
            variant="ghost"
            title="Ajouter une piste d'accessoire ou d'habillage"
            class="text-text-muted hover:text-primary hover:bg-primary/20 h-5 w-5"
          />
        </DropdownMenu>
      </div>
    </div>

    <!-- Liste des groupes et des en-têtes de pistes -->
    <div
      ref="listRef"
      class="flex-1 overflow-y-auto no-scrollbar"
      @scroll="emit('scroll', $event)"
    >
      <!-- Groupes ordonnés -->
      <template v-for="group in groups" :key="group.id">
        <!-- Ligne En-tête de Groupe (h-8) -->
        <SelectableSurface
          class="h-8 border-b border-border-subtle/70 px-2 flex items-center justify-between gap-1.5 text-xs font-semibold transition-colors cursor-pointer select-none"
          density="compact"
          role="treeitem"
          :selected="timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'"
          :class="[
            timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'
              ? 'bg-primary/20 text-text-primary ring-2 ring-inset ring-primary/60 shadow-glow-sm border-l-4 border-l-primary'
              : 'bg-bg-surface/90 hover:bg-bg-surface-hover/60 text-text-secondary'
          ]"
          @click="timelineStore.selectGroupForEditing(group.id)"
        >
          <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
            <IconButton
              icon="expand_more"
              size="xs"
              variant="ghost"
              class="text-text-muted hover:text-text-primary transition-transform cursor-pointer p-0.5"
              :class="{ '-rotate-90': group.collapsed }"
              title="Replier / Déplier le groupe"
              @click.stop="timelineStore.toggleGroupCollapse(group.id)"
            />

            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="groupColorClasses[group.color || 'indigo'].dot"
            />

            <span class="truncate font-bold tracking-tight text-text-primary text-[11px]">{{ group.name }}</span>
            <Badge
              v-if="timelineStore.selectedGroupId === group.id && timelineStore.editScope === 'group'"
              variant="accent"
              size="sm"
              class="px-1.5 py-0 text-[8px]"
            >Actif</Badge>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <!-- Badge Z-Global -->
            <Badge
              variant="accent"
              size="sm"
              class="text-[9px] font-mono px-1 py-0 shadow-xs"
              :title="`Z-Index Global du groupe: ${group.zIndex}`"
            >
              Z-G:{{ group.zIndex }}
            </Badge>

            <!-- Mute Groupe -->
            <IconButton
              :icon="group.muted ? 'visibility_off' : 'visibility'"
              size="xs"
              variant="ghost"
              :title="group.muted ? 'Réactiver le groupe' : 'Masquer tout le groupe'"
              :class="group.muted ? 'text-danger' : 'text-text-muted hover:text-text-primary'"
              class="h-5 w-5"
              @click.stop="timelineStore.toggleGroupMute(group.id)"
            />

            <!-- Verrou Groupe -->
            <IconButton
              :icon="group.locked ? 'lock' : 'lock_open'"
              size="xs"
              variant="ghost"
              :title="group.locked ? 'Déverrouiller le groupe' : 'Verrouiller le groupe'"
              :class="group.locked ? 'text-amber-400' : 'text-text-muted hover:text-text-primary'"
              class="h-5 w-5"
              @click.stop="timelineStore.toggleGroupLock(group.id)"
            />

            <!-- Menu Options Groupe -->
            <IconButton
              v-if="!group.isDefault"
              icon="delete"
              size="xs"
              variant="destructive"
              :aria-label="`Supprimer le groupe ${group.name}`"
              title="Supprimer le groupe"
              class="h-5 w-5"
              @click.stop="requestGroupDeletion(group)"
            />

            <DropdownMenu
              :items="getGroupMenuItems(group)"
              align="end"
              surface="glass"
              width="md"
            >
              <IconButton
                icon="more_vert"
                size="xs"
                variant="ghost"
                title="Options du groupe"
                class="text-text-muted hover:text-text-primary h-5 w-5"
              />
            </DropdownMenu>
          </div>
        </SelectableSurface>

        <!-- Pistes Enfants du Groupe (visibles si non collapsed) -->
        <template v-if="!group.collapsed">
          <SelectableSurface
            v-for="track in getTracksByGroup(group.id)"
            :key="track.id"
            class="group h-8 border-b border-border-subtle/40 pl-5 pr-2 flex items-center justify-between gap-1 text-xs transition-colors cursor-pointer border-l-2"
            density="compact"
            role="treeitem"
            :selected="timelineStore.selectedTrackId === track.id && timelineStore.editScope === 'layer'"
            :style="categoryRowStyle(track.category)"
            :class="[
              timelineStore.selectedTrackId === track.id && timelineStore.editScope === 'layer'
                ? 'bg-primary/15 font-semibold text-text-primary ' + groupColorClasses[group.color || 'indigo'].border
                : 'hover:bg-bg-surface-hover/60 text-text-secondary border-l-transparent'
            ]"
            @click="timelineStore.selectTrackForEditing(track.id)"
          >
            <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
              <Icon
                :name="ASSET_CATEGORIES[track.targetSlot]?.icon || 'layers'"
                size="xs"
                class="shrink-0"
                :style="{ color: ASSET_CATEGORIES[track.category].color }"
              />
              <span class="truncate text-[11px]">{{ track.name }}</span>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <!-- Z-Index Local -->
              <span
                class="text-[9px] font-mono text-text-muted bg-bg-base/80 px-1 py-0.5 rounded border border-border-subtle/60"
                title="Z-Index Local dans le groupe"
              >
                Z:{{ track.zIndex }}
              </span>

              <!-- Nombre de keyframes -->
              <Badge variant="neutral" size="sm" class="text-[9px] font-mono px-1 py-0 bg-bg-base/70 border-border-subtle text-text-muted">
                {{ track.keyframes.length }}
              </Badge>

              <!-- Mute Piste -->
              <IconButton
                :icon="track.muted ? 'visibility_off' : 'visibility'"
                size="xs"
                variant="ghost"
                :title="track.muted ? 'Activer la piste' : 'Désactiver la piste'"
                :class="track.muted ? 'text-danger' : 'text-text-muted hover:text-text-primary'"
                class="h-5 w-5"
                @click.stop="timelineStore.toggleTrackMute(track.id)"
              />

              <!-- Supprimer Piste -->
              <IconButton
                v-if="canRemoveTrack(track)"
                icon="delete"
                size="xs"
                variant="ghost"
                title="Supprimer la piste"
                class="text-text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5"
                @click.stop="timelineStore.removeTrack(track.id)"
              />
            </div>
          </SelectableSurface>
        </template>
      </template>

      <!-- Pistes non groupées éventuelles -->
      <template v-if="ungroupedTracks.length > 0">
        <div class="h-6 px-2.5 bg-bg-base/60 text-[9px] font-bold text-text-muted flex items-center uppercase tracking-wider">
          Pistes libres
        </div>
        <SelectableSurface
          v-for="track in ungroupedTracks"
          :key="track.id"
          class="group h-8 border-b border-border-subtle/40 px-2.5 flex items-center justify-between gap-1 text-xs transition-colors cursor-pointer"
          density="compact"
          role="treeitem"
          :selected="timelineStore.selectedTrackId === track.id && timelineStore.editScope === 'layer'"
          :style="categoryRowStyle(track.category)"
          :class="[
            timelineStore.selectedTrackId === track.id && timelineStore.editScope === 'layer'
              ? 'bg-primary/15 border-l-2 border-l-primary font-semibold text-text-primary'
              : 'hover:bg-bg-surface-hover/60 text-text-secondary'
          ]"
          @click="timelineStore.selectTrackForEditing(track.id)"
        >
          <div class="flex items-center gap-1.5 truncate flex-1 min-w-0">
            <Icon
              :name="ASSET_CATEGORIES[track.targetSlot]?.icon || 'layers'"
              size="xs"
              class="text-primary/90 shrink-0"
            />
            <span class="truncate text-[11px]">{{ track.name }}</span>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <span class="text-[9px] font-mono text-text-muted bg-bg-base/80 px-1 py-0.5 rounded border border-border-subtle/60">
              Z:{{ track.zIndex }}
            </span>
          </div>
        </SelectableSurface>
      </template>
    </div>

    <!-- Modale de Création de Groupe -->
    <CreateGroupModal v-model:open="isCreateGroupOpen" />
    <DeleteGroupDialog
      v-model:open="isDeleteGroupOpen"
      :group="groupToDelete"
    />
  </div>
</template>
