<script setup lang="ts">
import {
  computed,
  onMounted,
  onUnmounted,
  onWatcherCleanup,
  ref,
  useTemplateRef,
  watchEffect
} from 'vue'
import type { Asset } from '@core/types/asset.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { alphaThumbnailCacheService } from '../services/alpha-thumbnail-cache.service'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Heading } from '@/components/ui/heading'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import { Skeleton } from '@/components/ui/skeleton'

const { asset, selected = false, allowDuplicate = false } = defineProps<{
  asset: Asset
  selected?: boolean
  allowDuplicate?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', asset: Asset): void
  (e: 'duplicate', asset: Asset): void
  (e: 'delete', asset: Asset): void
  (e: 'split', asset: Asset): void
}>()

const previewContainerRef = useTemplateRef<HTMLElement>('previewContainer')
const previewUrl = ref<string | null>(null)
const shouldLoadPreview = ref(false)
const previewState = ref<'idle' | 'loading' | 'loaded' | 'error'>('idle')
const category = computed(() => ASSET_CATEGORIES[asset.category])
const accentStyle = computed(() => ({ '--asset-accent': category.value.color }))
let previewObserver: IntersectionObserver | null = null

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined' || !previewContainerRef.value) {
    shouldLoadPreview.value = true
    return
  }

  previewObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      shouldLoadPreview.value = true
      previewObserver?.disconnect()
      previewObserver = null
    },
    { rootMargin: '240px' }
  )
  previewObserver.observe(previewContainerRef.value)
})

onUnmounted(() => previewObserver?.disconnect())

watchEffect(async () => {
  if (!shouldLoadPreview.value) return

  const blobId = asset.blobId
  previewUrl.value = null
  previewState.value = 'loading'
  let disposed = false
  let sourceAcquired = false
  let thumbnailAcquired = false

  onWatcherCleanup(() => {
    disposed = true
    if (sourceAcquired) blobCacheService.release(blobId)
    if (thumbnailAcquired) alphaThumbnailCacheService.release(blobId)
  })

  try {
    const sourceUrl = await blobCacheService.acquire(blobId)
    sourceAcquired = true
    if (disposed) {
      blobCacheService.release(blobId)
      sourceAcquired = false
      return
    }

    try {
      const thumbnailUrl = await alphaThumbnailCacheService.acquire(blobId, sourceUrl)
      thumbnailAcquired = true
      if (disposed) {
        alphaThumbnailCacheService.release(blobId)
        thumbnailAcquired = false
        blobCacheService.release(blobId)
        sourceAcquired = false
        return
      }

      previewUrl.value = thumbnailUrl
      blobCacheService.release(blobId)
      sourceAcquired = false
    } catch (error) {
      console.warn('Miniature alpha indisponible, utilisation de l’image originale :', error)
      previewUrl.value = sourceUrl
    }
  } catch (error) {
    previewState.value = 'error'
    console.error('Erreur chargement preview blob :', error)
  }
})

function onPreviewLoaded(): void {
  previewState.value = 'loaded'
}

function onPreviewError(): void {
  previewState.value = 'error'
}
</script>

<template>
  <SelectableSurface
    class="asset-card group relative flex flex-col gap-1.5 rounded-xl border p-2 cursor-pointer select-none"
    role="option"
    :selected="selected"
    :data-selected="selected"
    :style="accentStyle"
    @click="emit('select', asset)"
  >
    <div
      ref="previewContainer"
      class="asset-preview relative w-full aspect-square rounded-lg flex items-center justify-center overflow-hidden border"
      :aria-busy="previewState === 'idle' || previewState === 'loading'"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        :alt="asset.name"
        class="size-full object-contain pointer-events-none transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none group-hover:scale-[1.02]"
        :class="previewState === 'loaded' ? 'opacity-100' : 'opacity-0'"
        @load="onPreviewLoaded"
        @error="onPreviewError"
      />
      <Skeleton
        v-if="previewState === 'idle' || previewState === 'loading'"
        variant="rounded"
        rounded="lg"
        class="absolute inset-0 size-full"
        :aria-label="`Chargement de ${asset.name}`"
      >
        <span class="absolute inset-0 flex items-center justify-center text-text-muted/60">
          <Icon name="image" size="md" />
        </span>
      </Skeleton>
      <div
        v-else-if="previewState === 'error'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center text-text-muted"
        role="img"
        :aria-label="`Aperçu indisponible pour ${asset.name}`"
      >
        <Icon name="broken_image" size="md" />
        <span class="text-[9px] font-medium">Aperçu indisponible</span>
      </div>

      <IconButton
        icon="delete"
        size="xs"
        variant="ghost"
        :aria-label="`Supprimer ${asset.name}`"
        title="Supprimer l’asset"
        class="asset-delete absolute right-1.5 top-1.5 z-10 size-7 border border-border-default bg-bg-elevated/90 p-0 text-text-muted shadow-sm hover:border-danger/40 hover:text-danger"
        @click.stop="emit('delete', asset)"
      />
      <IconButton
        v-if="allowDuplicate"
        icon="add"
        size="xs"
        variant="ghost"
        :aria-label="`Ajouter une autre occurrence de ${asset.name}`"
        title="Ajouter une autre occurrence"
        class="asset-duplicate absolute left-1.5 top-1.5 z-10 size-7 border border-border-default bg-bg-elevated/90 p-0 text-text-muted shadow-sm hover:border-primary/40 hover:text-primary"
        @click.stop="emit('duplicate', asset)"
      />
      <IconButton
        v-if="asset.category === 'desk'"
        icon="content_cut"
        size="xs"
        variant="ghost"
        :aria-label="`Découper la profondeur de ${asset.name}`"
        title="Découpe de profondeur 2.5D"
        class="asset-split absolute left-1.5 top-1.5 z-10 size-7 border border-border-default bg-bg-elevated/90 p-0 text-text-muted shadow-sm hover:border-primary/40 hover:text-primary"
        :class="{ '!text-primary !border-primary/60': asset.deskSplit?.enabled }"
        @click.stop="emit('split', asset)"
      />
    </div>

    <div class="min-w-0 pt-0.5">
      <Heading
        as="h4"
        variant="sm"
        class="asset-name text-xs font-semibold text-text-primary group-hover:text-[var(--asset-accent)]"
        :title="asset.name"
      >
        {{ asset.name }}
      </Heading>
      <div class="mt-1 flex min-w-0 items-center justify-between gap-1.5">
        <div class="flex items-center gap-1 min-w-0 max-w-[70%]">
          <Badge
            variant="neutral"
            size="sm"
            class="asset-category min-w-0 px-1.5 py-0 text-[8px]"
            :title="category.label"
          >
            <Icon :name="category.icon" size="xs" class="shrink-0" />
            <span class="truncate">{{ category.label }}</span>
          </Badge>
          <Badge
            v-if="asset.category === 'desk' && asset.deskSplit?.enabled"
            variant="accent"
            size="sm"
            class="shrink-0 text-[8px] px-1 py-0 border-primary/40 text-primary"
          >
            2.5D
          </Badge>
        </div>
        <span class="shrink-0 text-[9px] text-text-muted font-mono">
          {{ asset.width }}&times;{{ asset.height }}
        </span>
      </div>
    </div>
  </SelectableSurface>
</template>

<style scoped>
.asset-card {
  border-color: rgb(255 255 255 / 8%);
  background: rgb(20 20 28 / 32%);
  box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 8%);
  transition: border-color 300ms ease-out, background-color 300ms ease-out, box-shadow 300ms ease-out;
}

.asset-card:hover {
  border-color: color-mix(in srgb, var(--asset-accent) 42%, transparent);
  background: color-mix(in srgb, var(--asset-accent) 4%, rgb(20 20 28 / 32%));
  box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 15%), 0 10px 24px rgb(0 0 0 / 16%);
}

.asset-card[data-selected='true'] {
  border-color: color-mix(in srgb, var(--asset-accent) 80%, white 10%);
  background: color-mix(in srgb, var(--asset-accent) 7%, rgb(20 20 28 / 34%));
  box-shadow: inset 0 1px 0 0 rgb(255 255 255 / 18%), 0 0 0 1px color-mix(in srgb, var(--asset-accent) 48%, transparent), 0 0 18px color-mix(in srgb, var(--asset-accent) 12%, transparent);
}

.asset-preview {
  border-color: rgb(255 255 255 / 7%);
  background-color: rgb(7 7 12 / 78%);
  background-image:
    linear-gradient(45deg, rgb(255 255 255 / 3.5%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 3.5%) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 3.5%) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 3.5%) 75%);
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
  background-size: 16px 16px;
}

.asset-name {
  display: -webkit-box;
  min-height: 2rem;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  transition: color 300ms ease-out;
}

.asset-category {
  border-color: color-mix(in srgb, var(--asset-accent) 35%, transparent);
  background: color-mix(in srgb, var(--asset-accent) 12%, transparent);
  color: color-mix(in srgb, var(--asset-accent) 82%, white 18%);
}

.asset-delete {
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 200ms ease-out, transform 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out;
}

.asset-duplicate {
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 200ms ease-out, transform 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out;
}

.asset-split {
  opacity: 0;
  transform: translateY(-2px);
  transition: opacity 200ms ease-out, transform 200ms ease-out, color 200ms ease-out, border-color 200ms ease-out;
}

.asset-card:hover .asset-delete,
.asset-card:focus-within .asset-delete,
.asset-card[data-selected='true'] .asset-delete {
  opacity: 0.82;
  transform: translateY(0);
}

.asset-card:hover .asset-duplicate,
.asset-card:focus-within .asset-duplicate,
.asset-card[data-selected='true'] .asset-duplicate {
  opacity: 0.82;
  transform: translateY(0);
}

.asset-card:hover .asset-split,
.asset-card:focus-within .asset-split,
.asset-card[data-selected='true'] .asset-split {
  opacity: 0.82;
  transform: translateY(0);
}

@media (hover: none) {
  .asset-delete {
    opacity: 0.82;
    transform: none;
  }


  .asset-duplicate {
    opacity: 0.82;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .asset-card,
  .asset-delete,
  .asset-duplicate,
  .asset-name {
    transition: none;
  }
}
</style>
