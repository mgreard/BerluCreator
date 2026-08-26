<script setup lang="ts">
import type { SpritesheetSlice, AssetCategory } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import { CategoryBadge } from '@/components/ui/category-badge'
import SliceThumbnail from './SliceThumbnail.vue'

const {
  slices = [],
  selectedSliceId = null,
  imageElement = null
} = defineProps<{
  slices: SpritesheetSlice[]
  selectedSliceId: string | null
  imageElement: HTMLImageElement | null
  category: AssetCategory
}>()

const emit = defineEmits<{
  (e: 'selectSlice', sliceId: string): void
  (e: 'updateSlice', payload: { id: string; updates: Partial<SpritesheetSlice> }): void
  (e: 'removeSlice', sliceId: string): void
}>()

function onNameChange(slice: SpritesheetSlice, newName: string) {
  emit('updateSlice', { id: slice.id, updates: { name: newName } })
}
</script>

<template>
  <div class="w-84 h-full border-l border-border-subtle bg-bg-surface/80 backdrop-blur-md flex flex-col select-none overflow-hidden shrink-0">
    <!-- En-tête de la liste -->
    <div class="h-11 border-b border-border-subtle px-4 flex items-center justify-between shrink-0 bg-bg-surface/60">
      <div class="flex items-center gap-2">
        <Icon name="content_cut" size="xs" class="text-primary" />
        <span class="font-bold text-xs text-text-primary">Sprites Découpés</span>
      </div>

      <Badge variant="neutral" size="sm" class="font-mono text-[10px]">
        {{ slices.length }} {{ slices.length > 1 ? 'sprites' : 'sprite' }}
      </Badge>
      <CategoryBadge
        :label="ASSET_CATEGORIES[category].label"
        :icon-name="ASSET_CATEGORIES[category].icon"
        :color="ASSET_CATEGORIES[category].color"
        size="mini"
      />
    </div>

    <!-- Contenu défilant : Cartes des sprites découpés -->
    <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
      <SelectableSurface
        v-for="(slice, index) in slices"
        :key="slice.id"
        class="rounded-xl border transition-all duration-150 overflow-hidden cursor-pointer"
        role="option"
        :selected="slice.id === selectedSliceId"
        :class="[
          slice.id === selectedSliceId
            ? 'bg-bg-elevated border-primary/60 shadow-glass-sm ring-1 ring-primary/30'
            : 'bg-bg-surface/60 border-border-subtle/70 hover:bg-bg-surface-hover/60 hover:border-border-default'
        ]"
        @click="emit('selectSlice', slice.id)"
      >
        <!-- En-tête de la carte avec miniature et nom -->
        <div class="p-2.5 flex items-start gap-2.5 border-b border-border-subtle/50">
          <!-- Miniature Canevas du sprite découpé -->
          <div class="w-12 h-12 rounded-lg bg-bg-base/80 border border-border-subtle/60 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <SliceThumbnail
              :image-element="imageElement"
              :slice="slice"
            />
          </div>

          <!-- Nom et dimensions -->
          <div class="flex-1 min-w-0 space-y-1">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] font-bold text-text-muted uppercase">
                #{{ index + 1 }}
              </span>
              <span class="text-[9px] font-mono text-text-muted">
                {{ slice.width }} × {{ slice.height }} px
              </span>
            </div>

            <Input
              :model-value="slice.name"
              size="sm"
              class="h-7 text-xs"
              placeholder="Nom du sprite..."
              @click.stop
              @update:model-value="onNameChange(slice, String($event))"
            />
          </div>

          <!-- Bouton Supprimer Slice -->
          <IconButton
            icon="delete"
            size="xs"
            variant="ghost"
            title="Supprimer cette découpe"
            class="text-text-muted hover:text-danger -mr-1 -mt-1"
            @click.stop="emit('removeSlice', slice.id)"
          />
        </div>

      </SelectableSurface>

      <!-- État vide (aucun rectangle tracé) -->
      <EmptyState
        v-if="slices.length === 0"
        icon="crop"
        title="Aucun sprite découpé"
        description="Tracez un rectangle à la souris sur la planche à gauche pour découper votre premier sprite."
        class="h-64 border-0 bg-transparent shadow-none p-6"
      />
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.22);
}
</style>
