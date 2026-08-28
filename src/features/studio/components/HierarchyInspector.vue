<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import type { CharacterGroup, CharacterMode, EditorGroup, EditorLayer } from '@core/types/editor.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Text } from '@/components/ui/text'
import LayerSettingsModal from './LayerSettingsModal.vue'

const editorStore = useEditorStore()
const assetStore = useAssetStore()
const open = defineModel<boolean>('open', { default: true })
const isSettingsOpen = ref(false)
const settingsLayer = ref<EditorLayer | null>(null)
const settingsGroup = ref<EditorGroup | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listRef')

const modeOptions = [
  { value: 'full', label: 'Complet', icon: 'person' },
  { value: 'rig', label: 'Rig', icon: 'accessibility_new' }
]

const characterGroups = computed(() =>
  editorStore.currentDocument.groups.filter((group): group is CharacterGroup => group.kind === 'character')
)

const stageLayers = computed(() =>
  editorStore.currentDocument.layers
    .filter((layer) => {
      const group = editorStore.currentDocument.groups.find((candidate) => candidate.id === layer.groupId)
      return group?.kind === 'stage'
    })
    .sort((left, right) => right.zIndex - left.zIndex || right.order - left.order)
)

function layersForCharacter(groupId: string, mode: CharacterMode): EditorLayer[] {
  return editorStore.currentDocument.layers
    .filter((layer) =>
      layer.groupId === groupId &&
      (mode === 'full' ? layer.category === 'character_full' : layer.category !== 'character_full')
    )
    .sort((left, right) => right.zIndex - left.zIndex || right.order - left.order)
}

function assetExists(layer: EditorLayer): boolean {
  return assetStore.assets.some((asset) => asset.id === layer.assetId)
}

function selectLayer(layer: EditorLayer): void {
  editorStore.selectLayerForEditing(layer.id)
}

function openLayerSettings(layer: EditorLayer): void {
  selectLayer(layer)
  settingsGroup.value = null
  settingsLayer.value = layer
  isSettingsOpen.value = true
}

function openGroupSettings(group: EditorGroup): void {
  editorStore.selectGroupForEditing(group.id)
  settingsLayer.value = null
  settingsGroup.value = group
  isSettingsOpen.value = true
}

function updateLayerZIndex(layer: EditorLayer, value: string | number): void {
  const zIndex = Number(value)
  if (Number.isFinite(zIndex)) editorStore.updateLayerZIndex(layer.id, zIndex)
}

function setMode(group: CharacterGroup, value: string | number): void {
  if (value === 'full' || value === 'rig') editorStore.setCharacterMode(group.id, value)
}

watch(
  () => [editorStore.selectedGroupId, editorStore.selectedLayerId],
  async ([groupId, layerId]) => {
    if (!groupId && !layerId) return
    await nextTick()
    const key = layerId ? `layer:${layerId}` : `group:${groupId}`
    const target = Array.from(listRef.value?.querySelectorAll<HTMLElement>('[data-selection-key]') ?? [])
      .find((element) => element.dataset.selectionKey === key)
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
)
</script>

<template>
  <div data-tour="hierarchy" class="flex h-full w-full select-none flex-col border-l border-border-subtle bg-bg-surface/50 backdrop-blur-md">
    <div class="flex h-10 shrink-0 items-center justify-between border-b border-border-subtle bg-bg-surface/40 px-3">
      <div class="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
        <IconButton icon="right_panel_close" size="xs" variant="ghost" aria-label="Replier l’inspecteur" @click="open = false" />
        <Icon name="account_tree" size="xs" class="text-primary" />
        <span>Personnages & Plateau</span>
      </div>
      <Badge variant="neutral" size="sm" class="font-mono text-[10px]">
        {{ editorStore.currentDocument.layers.length }} calques
      </Badge>
    </div>

    <div ref="listRef" class="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-2.5">
      <section v-for="group in characterGroups" :key="group.id" class="space-y-1.5">
        <SelectableSurface
          as="div"
          role="button"
          tabindex="0"
          :selected="editorStore.selectedGroupId === group.id && editorStore.editScope === 'group'"
          :data-selection-key="`group:${group.id}`"
          class="flex w-full cursor-pointer items-center justify-between rounded-xl border p-2.5"
          @click="editorStore.selectGroupForEditing(group.id)"
        >
          <div class="flex min-w-0 items-center gap-2">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Icon :name="group.activeMode === 'full' ? 'person' : 'accessibility_new'" size="xs" />
            </div>
            <div class="min-w-0">
              <span class="block truncate text-xs font-bold text-text-primary">{{ group.name }}</span>
              <span class="font-mono text-[10px] text-text-muted">Mode {{ group.activeMode === 'full' ? 'complet' : 'rig' }}</span>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <IconButton
              :icon="group.muted ? 'visibility_off' : 'visibility'"
              size="xs"
              variant="ghost"
              :class="group.muted ? 'text-danger' : 'text-text-muted'"
              :aria-label="group.muted ? 'Afficher le personnage' : 'Masquer le personnage'"
              @click.stop="editorStore.toggleGroupMuted(group.id)"
            />
            <IconButton
              :icon="group.locked ? 'lock' : 'lock_open'"
              size="xs"
              variant="ghost"
              :active="group.locked"
              :aria-label="group.locked ? 'Déverrouiller le personnage' : 'Verrouiller le personnage'"
              @click.stop="editorStore.setGroupLocked(group.id, !group.locked)"
            />
            <IconButton icon="tune" size="xs" variant="ghost" aria-label="Régler le personnage" @click.stop="openGroupSettings(group)" />
          </div>
        </SelectableSurface>

        <SegmentedControl
          :model-value="group.activeMode"
          :options="modeOptions"
          size="sm"
          variant="glass"
          class="w-full"
          @update:model-value="setMode(group, $event)"
        />

        <div v-for="mode in (['full', 'rig'] as const)" :key="mode" class="ml-3.5 space-y-1 border-l-2 pl-3" :class="group.activeMode === mode ? 'border-primary/40' : 'border-border-subtle opacity-60'">
          <div class="flex items-center justify-between py-0.5 text-[9px] font-bold uppercase tracking-wider text-text-muted">
            <span>{{ mode === 'full' ? 'Sprite complet' : 'Éléments du rig' }}</span>
            <Badge v-if="group.activeMode !== mode" variant="neutral" size="sm">Inactif</Badge>
          </div>

          <div
            v-for="layer in layersForCharacter(group.id, mode)"
            :key="layer.id"
            :data-selection-key="`layer:${layer.id}`"
            class="flex cursor-pointer items-center justify-between gap-1.5 rounded-lg border border-border-subtle bg-bg-surface/50 p-1.5 text-xs"
            :class="editorStore.selectedLayerId === layer.id ? 'border-primary bg-primary/20 ring-1 ring-primary/50' : ''"
            @click="selectLayer(layer)"
          >
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <Icon :name="ASSET_CATEGORIES[layer.category].icon" size="xs" :style="{ color: ASSET_CATEGORIES[layer.category].color }" />
              <span class="truncate text-[11px] font-medium" :class="assetExists(layer) ? 'text-text-primary' : 'text-danger'">
                {{ layer.name }}<span v-if="!assetExists(layer)"> · asset manquant</span>
              </span>
            </div>
            <div class="flex shrink-0 items-center gap-0.5">
              <IconButton icon="arrow_downward" size="xs" variant="ghost" aria-label="Descendre le calque" @click.stop="editorStore.moveLayer(layer.id, -1)" />
              <IconButton icon="arrow_upward" size="xs" variant="ghost" aria-label="Monter le calque" @click.stop="editorStore.moveLayer(layer.id, 1)" />
              <IconButton :icon="layer.muted ? 'visibility_off' : 'visibility'" size="xs" variant="ghost" @click.stop="editorStore.setLayerMuted(layer.id, !layer.muted)" />
              <IconButton :icon="layer.locked ? 'lock' : 'lock_open'" size="xs" variant="ghost" :active="layer.locked" @click.stop="editorStore.setLayerLocked(layer.id, !layer.locked)" />
              <IconButton icon="tune" size="xs" variant="ghost" @click.stop="openLayerSettings(layer)" />
              <IconButton icon="delete" size="xs" variant="ghost" class="text-danger" @click.stop="editorStore.removeLayer(layer.id)" />
            </div>
          </div>

          <Text v-if="layersForCharacter(group.id, mode).length === 0" variant="caption" color="muted" class="py-1 text-[10px] italic">
            {{ mode === 'full' ? 'Aucun sprite complet configuré.' : 'Aucun élément de rig configuré.' }}
          </Text>
        </div>
      </section>

      <section class="space-y-1.5 border-t border-border-subtle/60 pt-3">
        <div class="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
          <Icon name="tv_gen" size="xs" />
          <span>Plateau & Décor ({{ stageLayers.length }})</span>
        </div>

        <div
          v-for="layer in stageLayers"
          :key="layer.id"
          :data-selection-key="`layer:${layer.id}`"
          class="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-surface/60 p-2 text-xs"
          :class="editorStore.selectedLayerId === layer.id ? 'border-primary bg-primary/20 ring-1 ring-primary/50' : ''"
          @click="selectLayer(layer)"
        >
          <div class="flex min-w-0 flex-1 items-center gap-2">
            <Icon :name="ASSET_CATEGORIES[layer.category].icon" size="xs" :style="{ color: ASSET_CATEGORIES[layer.category].color }" />
            <span class="truncate" :class="assetExists(layer) ? 'text-text-primary' : 'text-danger'">{{ layer.name }}</span>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <Input :model-value="layer.zIndex" type="number" class="h-5 w-10 p-0 text-center text-[10px]" @update:model-value="updateLayerZIndex(layer, $event)" />
            <IconButton icon="arrow_downward" size="xs" variant="ghost" aria-label="Descendre le calque" @click.stop="editorStore.moveLayer(layer.id, -1)" />
            <IconButton icon="arrow_upward" size="xs" variant="ghost" aria-label="Monter le calque" @click.stop="editorStore.moveLayer(layer.id, 1)" />
            <IconButton :icon="layer.muted ? 'visibility_off' : 'visibility'" size="xs" variant="ghost" @click.stop="editorStore.setLayerMuted(layer.id, !layer.muted)" />
            <IconButton :icon="layer.locked ? 'lock' : 'lock_open'" size="xs" variant="ghost" :active="layer.locked" @click.stop="editorStore.setLayerLocked(layer.id, !layer.locked)" />
            <IconButton icon="tune" size="xs" variant="ghost" @click.stop="openLayerSettings(layer)" />
            <IconButton icon="delete" size="xs" variant="ghost" class="text-danger" @click.stop="editorStore.removeLayer(layer.id)" />
          </div>
        </div>

        <EmptyState v-if="stageLayers.length === 0" icon="layers_clear" title="Aucun décor sur le plateau" class="h-28 border-0 bg-transparent p-2 shadow-none" />
      </section>
    </div>

    <LayerSettingsModal v-model:open="isSettingsOpen" :group="settingsGroup" :layer="settingsLayer" />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgb(255 255 255 / 12%); border-radius: 9999px; }
</style>
