<script setup lang="ts">
import { computed, ref, watchEffect, onWatcherCleanup } from 'vue'
import type { Asset } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Heading } from '@/components/ui/heading'
import { SelectableSurface } from '@/components/ui/selectable-surface'

const { asset, selected = false } = defineProps<{
  asset: Asset
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', asset: Asset): void
  (e: 'delete', asset: Asset): void
  (e: 'calibrate', asset: Asset): void
}>()

const isCharacterCategory = computed(() => {
  return ASSET_CATEGORIES[asset.category]?.placementMode === 'character-anchored'
})

const previewUrl = ref<string | null>(null)

watchEffect(async () => {
  const currentBlobId = asset.blobId
  if (!currentBlobId) {
    previewUrl.value = null
    return
  }

  onWatcherCleanup(() => {
    blobCacheService.release(currentBlobId)
  })

  try {
    previewUrl.value = await blobCacheService.acquire(currentBlobId)
  } catch (err) {
    console.error('Erreur chargement preview blob:', err)
  }
})
</script>

<template>
  <SelectableSurface
    class="group relative rounded-xl border p-2 flex flex-col gap-1.5 transition-all duration-200 cursor-pointer select-none"
    role="option"
    :selected="selected"
    :class="[
      selected
        ? 'border-primary bg-primary/15 shadow-glow-sm ring-2 ring-primary/60 scale-[1.02]'
        : 'border-border-subtle bg-bg-surface/60 hover:border-primary/50 hover:bg-bg-surface-hover/80 hover:shadow-glass-sm'
    ]"
    @click="emit('select', asset)"
  >
    <!-- Vignette de prévisualisation -->
    <div
      class="relative w-full aspect-square rounded-lg bg-black/40 flex items-center justify-center overflow-hidden border border-border-subtle/50 pointer-events-none"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="asset.name"
        class="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-200 group-hover:scale-105"
      />
      <div v-else class="animate-pulse flex items-center justify-center text-text-muted">
        <Icon name="image" size="md" />
      </div>

      <!-- Badge indicateur calibré sur Berlu -->
      <Badge
        v-if="asset.calibration"
        variant="accent"
        size="sm"
        class="absolute top-1.5 left-1.5 text-[9px] font-semibold gap-1 shadow-glass-xs border-primary/40 backdrop-blur-md"
        title="Cet asset est calibré sur le mannequin de Berlu"
      >
        <Icon name="accessibility_new" size="xs" />
        <span>Calibré</span>
      </Badge>

      <!-- Badge indicateur déplaçable / mobile sur canvas -->
      <Badge
        v-else-if="asset.isMovable"
        variant="accent"
        size="sm"
        class="absolute top-1.5 left-1.5 text-[9px] font-semibold gap-1 shadow-glass-xs border-primary/30 backdrop-blur-md"
        title="Ce sprite peut être déplacé à la souris sur le canvas"
      >
        <Icon name="open_with" size="xs" class="text-primary" />
        <span>Mobile</span>
      </Badge>
    </div>

    <!-- Informations et Actions -->
    <div class="flex items-center justify-between gap-1 min-w-0 pt-0.5">
      <div class="truncate flex-1">
        <Heading as="h4" variant="sm" class="text-xs font-semibold text-text-primary truncate group-hover:text-primary transition-colors" :title="asset.name">
          {{ asset.name }}
        </Heading>
        <div class="flex items-center gap-1.5 mt-0.5">
          <Badge variant="neutral" size="sm" class="text-[9px] px-1 py-0 uppercase font-mono bg-bg-surface-hover border-border-subtle text-text-muted">
            {{ asset.category }}
          </Badge>
          <span class="text-[10px] text-text-muted font-mono">
            {{ asset.width }}&times;{{ asset.height }}
          </span>
        </div>
      </div>

      <!-- Actions directes -->
      <div class="flex items-center gap-0.5 shrink-0">
        <IconButton
          v-if="isCharacterCategory"
          icon="accessibility_new"
          size="xs"
          variant="ghost"
          title="Calibrer sur le mannequin Berlu (Fitting Room)"
          class="size-6 p-0 text-text-muted hover:text-primary hover:bg-primary/10"
          @click.stop="emit('calibrate', asset)"
        />
        <IconButton
          icon="delete"
          size="xs"
          variant="ghost"
          title="Supprimer l'asset"
          class="size-6 p-0 text-text-muted hover:text-danger opacity-60 hover:opacity-100"
          @click.stop="emit('delete', asset)"
        />
      </div>
    </div>
  </SelectableSurface>
</template>
