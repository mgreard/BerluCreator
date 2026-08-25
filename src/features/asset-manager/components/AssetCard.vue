<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Asset } from '@core/types/asset.types'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'

const { asset, selected = false } = defineProps<{
  asset: Asset
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', asset: Asset): void
  (e: 'editAnchors', asset: Asset): void
  (e: 'delete', asset: Asset): void
}>()

const previewUrl = ref<string | null>(null)

onMounted(async () => {
  try {
    previewUrl.value = await blobCacheService.acquire(asset.blobId)
  } catch (err) {
    console.error('Erreur chargement preview blob:', err)
  }
})

onUnmounted(() => {
  blobCacheService.release(asset.blobId)
})
</script>

<template>
  <div
    class="group relative rounded-xl border p-2 flex flex-col gap-2 transition-all cursor-pointer select-none"
    :class="[
      selected
        ? 'border-primary bg-primary/10 shadow-glass-sm'
        : 'border-border/50 bg-surface/40 hover:border-border hover:bg-surface-hover/60'
    ]"
    @click="emit('select', asset)"
  >
    <!-- Vignette de prévisualisation -->
    <div
      class="relative w-full aspect-square rounded-lg bg-black/40 flex items-center justify-center overflow-hidden border border-border/30"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="asset.name"
        class="max-w-full max-h-full object-contain pointer-events-none"
      />
      <div v-else class="animate-pulse flex items-center justify-center text-muted-foreground">
        <Icon name="image" size="md" />
      </div>

      <!-- Badge nombre d'ancres -->
      <span
        v-if="asset.anchors.length > 0"
        class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-black/70 text-white border border-white/10"
      >
        {{ asset.anchors.length }} ancre{{ asset.anchors.length > 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Informations et Actions -->
    <div class="flex items-center justify-between gap-1 min-w-0">
      <div class="truncate flex-1">
        <h4 class="text-xs font-semibold text-foreground truncate" :title="asset.name">
          {{ asset.name }}
        </h4>
        <div class="flex items-center gap-1 mt-0.5">
          <Badge variant="secondary" size="sm" class="text-[9px] px-1 py-0 uppercase">
            {{ asset.category }}
          </Badge>
          <span class="text-[10px] text-muted-foreground font-mono">
            {{ asset.width }}&times;{{ asset.height }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton
          icon="adjust"
          size="xs"
          variant="ghost"
          title="Éditer les points d'ancrage"
          @click.stop="emit('editAnchors', asset)"
        />
        <IconButton
          icon="delete"
          size="xs"
          variant="destructive"
          title="Supprimer l'asset"
          @click.stop="emit('delete', asset)"
        />
      </div>
    </div>
  </div>
</template>
