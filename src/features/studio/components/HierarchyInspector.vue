<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useHierarchyResolver, type RenderableLayer } from '../composables/useHierarchyResolver'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import LayerSettingsModal from './LayerSettingsModal.vue'

const { activeLayers } = useHierarchyResolver()
const editorStore = useEditorStore()
const open = defineModel<boolean>('open', { default: true })

const isSettingsOpen = ref(false)
const settingsLayer = ref<RenderableLayer | null>(null)
const listRef = useTemplateRef<HTMLDivElement>('listRef')

// Calques du Personnage (Rig)
const characterLayers = computed(() => {
  return activeLayers.value
    .filter((l) => ASSET_CATEGORIES[l.category]?.placementMode === 'character-anchored')
    .sort((a, b) => b.layerZIndex - a.layerZIndex)
})

// Calques du Décor & Plateau
const stageLayers = computed(() => {
  return activeLayers.value
    .filter((l) => ASSET_CATEGORIES[l.category]?.placementMode === 'free-transform')
    .sort((a, b) => b.layerZIndex - a.layerZIndex)
})

const isCharacterSelected = computed(() => {
  return editorStore.editScope === 'group' && editorStore.selectedGroupId === 'grp_berlu'
})

function selectCharacter() {
  editorStore.selectGroupForEditing('grp_berlu')
}

function selectLayer(layer: RenderableLayer) {
  editorStore.selectLayerForEditing(layer.layerId)
}

function openLayerSettings(layer: RenderableLayer) {
  selectLayer(layer)
  settingsLayer.value = layer
  isSettingsOpen.value = true
}

function removeLayer(layer: RenderableLayer) {
  editorStore.removeLayer(layer.layerId)
}

function updateLayerZIndex(layer: RenderableLayer, value: string | number) {
  const zIndex = Number(value)
  if (Number.isFinite(zIndex)) editorStore.updateLayerZIndex(layer.layerId, zIndex)
}

function toggleCharacterVisibility() {
  editorStore.toggleGroupMuted('grp_berlu')
}

function toggleLayerVisibility(layer: RenderableLayer) {
  const current = editorStore.currentDocument.layers.find((l) => l.id === layer.layerId)
  if (current) {
    editorStore.setLayerMuted(layer.layerId, !current.muted)
  }
}

watch(
  () => [
    editorStore.selectedGroupId,
    editorStore.selectedLayerId
  ],
  async ([groupId, layerId]) => {
    if (!groupId && !layerId) return
    await nextTick()

    const elements = listRef.value?.querySelectorAll<HTMLElement>('[data-selection-key]')
    const selectionKey = layerId ? `layer:${layerId}` : `group:${groupId}`
    const target = Array.from(elements ?? []).find(
      (element) => element.dataset.selectionKey === selectionKey
    )
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
)
</script>

<template>
  <div data-tour="hierarchy" class="w-full h-full border-l border-border-subtle bg-bg-surface/50 backdrop-blur-md flex flex-col select-none">
    <!-- En-tête de l'inspecteur -->
    <div class="h-10 border-b border-border-subtle px-3 flex items-center justify-between shrink-0 bg-bg-surface/40">
      <div class="flex items-center gap-1.5 font-semibold text-xs text-text-primary">
        <IconButton
          icon="right_panel_close"
          size="xs"
          variant="ghost"
          aria-label="Replier l’inspecteur de calques"
          title="Replier l’inspecteur de calques"
          @click="open = false"
        />
        <Icon name="account_tree" size="xs" class="text-primary" />
        <span>Squelette & Plateau</span>
      </div>

      <Badge variant="neutral" size="sm" class="text-[10px] font-mono">
        {{ activeLayers.length }} calques
      </Badge>
    </div>

    <!-- Liste à 2 sections : Personnage (Rig) vs Plateau & Décor -->
    <div ref="listRef" class="flex-1 overflow-y-auto p-2.5 space-y-4 custom-scrollbar">
      <!-- SECTION 1 : PERSONNAGE (BERLU - RIG) -->
      <div class="space-y-1.5">
        <!-- Carte Maître du Personnage -->
        <SelectableSurface
          as="div"
          role="button"
          tabindex="0"
          :selected="isCharacterSelected"
          data-selection-key="group:grp_berlu"
          class="w-full rounded-xl border p-2.5 flex items-center justify-between transition-all duration-150 cursor-pointer"
          :class="[
            isCharacterSelected
              ? 'bg-primary/20 border-primary ring-2 ring-primary/40 shadow-glow-xs'
              : 'bg-bg-surface/70 border-border-default/80 hover:bg-bg-surface-hover/70 hover:border-primary/40'
          ]"
          @click="selectCharacter"
        >
          <div class="flex items-center gap-2 min-w-0">
            <div class="size-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Icon name="accessibility_new" size="xs" />
            </div>
            <div class="min-w-0">
              <span class="text-xs font-bold text-text-primary truncate block">Personnage (Berlu)</span>
              <span class="text-[10px] text-text-muted font-mono">
                {{ characterLayers.length }} pièces équipées
              </span>
            </div>
          </div>

          <div class="flex items-center gap-1">
            <IconButton
              :icon="editorStore.currentDocument.character?.visible !== false ? 'visibility' : 'visibility_off'"
              size="xs"
              variant="ghost"
              :class="editorStore.currentDocument.character?.visible !== false ? 'text-text-muted hover:text-text-primary' : 'text-danger'"
              title="Afficher/Masquer le personnage"
              @click.stop="toggleCharacterVisibility"
            />
          </div>
        </SelectableSurface>

        <!-- Pièces du corps équipées sur Berlu -->
        <div class="pl-3 space-y-1 border-l-2 border-primary/30 ml-3.5 my-1">
          <div
            v-for="layer in characterLayers"
            :key="layer.id"
            :data-selection-key="`layer:${layer.layerId}`"
            class="group rounded-lg border p-1.5 flex items-center justify-between gap-1.5 transition-all text-xs cursor-pointer"
            :class="[
              editorStore.selectedLayerId === layer.layerId
                ? 'bg-primary/20 border-primary shadow-xs ring-1 ring-primary/50'
                : 'bg-bg-surface/50 border-border-subtle hover:bg-bg-surface-hover/50 hover:border-border-default'
            ]"
            @click="selectLayer(layer)"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <Icon
                :name="ASSET_CATEGORIES[layer.category]?.icon || 'image'"
                size="xs"
                :style="{ color: ASSET_CATEGORIES[layer.category]?.color }"
                class="shrink-0"
              />
              <span class="truncate text-[11px] font-medium text-text-primary" :title="layer.name">
                {{ layer.name }}
              </span>
            </div>

            <!-- Actions de la pièce -->
            <div class="flex items-center gap-0.5 shrink-0">
              <IconButton
                icon="tune"
                size="xs"
                variant="ghost"
                class="size-6 p-0 text-text-muted hover:text-primary"
                title="Régler ce calque"
                @click.stop="openLayerSettings(layer)"
              />
              <IconButton
                icon="delete"
                size="xs"
                variant="ghost"
                class="size-6 p-0 text-text-muted hover:text-danger opacity-60 hover:opacity-100"
                title="Retirer cette pièce"
                @click.stop="removeLayer(layer)"
              />
            </div>
          </div>

          <div v-if="characterLayers.length === 0" class="text-[11px] text-text-muted italic py-1 pl-1">
            Aucun membre équipé. Cliquez sur un sprite dans la bibliothèque.
          </div>
        </div>
      </div>

      <!-- SECTION 2 : PLATEAU & DÉCOR -->
      <div class="space-y-1.5 pt-2 border-t border-border-subtle/60">
        <div class="px-1 flex items-center justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
          <div class="flex items-center gap-1.5">
            <Icon name="tv_gen" size="xs" />
            <span>Plateau & Décor ({{ stageLayers.length }})</span>
          </div>
        </div>

        <div class="space-y-1">
          <div
            v-for="layer in stageLayers"
            :key="layer.id"
            :data-selection-key="`layer:${layer.layerId}`"
            class="group rounded-xl border p-2 flex items-center justify-between gap-2 transition-all text-xs cursor-pointer"
            :class="[
              editorStore.selectedLayerId === layer.layerId
                ? 'bg-primary/20 border-primary shadow-xs ring-1 ring-primary/50'
                : 'bg-bg-surface/60 border-border-subtle hover:bg-bg-surface-hover/60 hover:border-border-default'
            ]"
            @click="selectLayer(layer)"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <Icon
                :name="ASSET_CATEGORIES[layer.category]?.icon || 'image'"
                size="xs"
                :style="{ color: ASSET_CATEGORIES[layer.category]?.color }"
                class="shrink-0"
              />
              <div class="min-w-0 truncate">
                <span class="truncate text-xs font-semibold text-text-primary block" :title="layer.name">
                  {{ layer.name }}
                </span>
                <span class="text-[9px] text-text-muted uppercase font-mono">
                  {{ layer.category }}
                </span>
              </div>
            </div>

            <!-- Z-Index & Actions -->
            <div class="flex items-center gap-1 shrink-0">
              <div class="flex items-center gap-0.5 bg-black/40 border border-border-subtle/80 rounded px-1 py-0.5">
                <span class="text-[9px] font-mono text-text-muted">Z:</span>
                <Input
                  :model-value="layer.layerZIndex"
                  type="number"
                  class="w-8 h-4 p-0 text-[10px] font-mono text-center bg-transparent border-0"
                  @update:model-value="updateLayerZIndex(layer, $event)"
                />
              </div>

              <IconButton
                :icon="!layer.muted ? 'visibility' : 'visibility_off'"
                size="xs"
                variant="ghost"
                class="size-6 p-0 text-text-muted hover:text-text-primary"
                title="Afficher/Masquer ce calque"
                @click.stop="toggleLayerVisibility(layer)"
              />
              <IconButton
                icon="tune"
                size="xs"
                variant="ghost"
                class="size-6 p-0 text-text-muted hover:text-primary"
                title="Paramètres du calque"
                @click.stop="openLayerSettings(layer)"
              />
              <IconButton
                icon="delete"
                size="xs"
                variant="ghost"
                class="size-6 p-0 text-text-muted hover:text-danger opacity-60 hover:opacity-100"
                title="Supprimer le calque"
                @click.stop="removeLayer(layer)"
              />
            </div>
          </div>

          <EmptyState
            v-if="stageLayers.length === 0"
            icon="layers_clear"
            title="Aucun décor sur le plateau"
            class="h-28 border-0 bg-transparent shadow-none p-2"
          />
        </div>
      </div>
    </div>

    <!-- Modale de réglage de calque individuel -->
    <LayerSettingsModal
      v-model:open="isSettingsOpen"
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
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
</style>
