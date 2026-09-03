<script setup lang="ts">
import { computed, onUnmounted, ref, watchEffect } from 'vue'
import { useRigCatalogStore } from '../../rig-calibration/rig-catalog.store'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useRigRuntime } from '../../rig-calibration/useRigRuntime'
import { blobCacheService } from '@infrastructure/storage/blob-cache.service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Text } from '@/components/ui/text'
import type { RigDefinition } from '../../rig-calibration/rig-catalog.types'

const rigCatalog = useRigCatalogStore()
const assetStore = useAssetStore()
const rigRuntime = useRigRuntime()

const rigs = computed(() => rigCatalog.rigs)
const selectedRigId = computed(() => rigCatalog.selectedRigId)

// Map of blob URLs for body thumbnails
const thumbnailUrls = ref<Record<string, string>>({})
const acquiredBlobIds = new Set<string>()

watchEffect(() => {
  const assets = assetStore.assets
  const currentRigs = rigs.value

  for (const rig of currentRigs) {
    const body = rigCatalog.resolveBodyAsset(rig, assets)
    if (body?.blobId && !thumbnailUrls.value[body.blobId]) {
      const blobId = body.blobId
      void blobCacheService
        .acquire(blobId)
        .then((url) => {
          if (url) {
            acquiredBlobIds.add(blobId)
            thumbnailUrls.value = {
              ...thumbnailUrls.value,
              [blobId]: url
            }
          }
        })
        .catch(() => {
          // Ignore if blob not found
        })
    }
  }
})

onUnmounted(() => {
  for (const blobId of acquiredBlobIds) {
    blobCacheService.release(blobId)
  }
  acquiredBlobIds.clear()
})

function onSelectRig(rig: RigDefinition): void {
  if (rigCatalog.selectedRigId === rig.id) return
  rigCatalog.selectedRigId = rig.id
  rigRuntime.syncRigLayers(rig.id)
}

function rigButtonClass(rig: RigDefinition): string {
  const stateClass =
    selectedRigId.value === rig.id
      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_16px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400'
      : 'border-border-default bg-bg-elevated/70 hover:border-border-subtle hover:bg-bg-elevated'
  return `group relative h-24 w-32 shrink-0 rounded-xl border p-2 text-left transition-all duration-200 outline-none [&>span]:flex [&>span]:size-full [&>span]:flex-col [&>span]:items-center [&>span]:justify-between ${stateClass}`
}
</script>

<template>
  <div
    class="w-full border-t border-border-default bg-bg-surface/95 backdrop-blur-md px-4 py-2.5 shadow-2xl z-30 flex flex-col gap-1.5"
    data-testid="rig-body-selector"
  >
    <div class="flex items-center justify-between px-1">
      <div class="flex items-center gap-2">
        <span class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
          1
        </span>
        <Text variant="caption" weight="bold" class="uppercase tracking-wider text-text-secondary">
          Corps du personnage
        </Text>
        <span class="text-xs text-text-muted">({{ rigs.length }})</span>
      </div>
      <Text variant="caption" color="muted" class="text-xs">
        Cliquez sur un corps pour calibrer ses têtes et accessoires
      </Text>
    </div>

    <!-- Horizontal Scroll Carousel -->
    <div
      class="flex items-center gap-3 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-border-subtle hover:scrollbar-thumb-border-default"
    >
      <Button
        v-for="rig in rigs"
        :key="rig.id"
        variant="ghost"
        size="xs"
        :active="selectedRigId === rig.id"
        :aria-pressed="selectedRigId === rig.id"
        :aria-label="rig.name"
        :class="rigButtonClass(rig)"
        @click="onSelectRig(rig)"
      >
        <!-- Body Thumbnail -->
        <div class="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-lg bg-black/25">
          <img
            v-if="rigCatalog.resolveBodyAsset(rig, assetStore.assets)?.blobId && thumbnailUrls[rigCatalog.resolveBodyAsset(rig, assetStore.assets)!.blobId]"
            :src="thumbnailUrls[rigCatalog.resolveBodyAsset(rig, assetStore.assets)!.blobId]"
            :alt="rig.name"
            class="max-h-full max-w-full object-contain transition-transform duration-200 group-hover:scale-105"
            draggable="false"
          />
          <Icon v-else name="accessibility_new" size="sm" class="text-text-muted/60" />
        </div>

        <!-- Body Name & Status -->
        <div class="flex w-full items-center justify-between gap-1 mt-1">
          <span
            class="truncate text-xs font-semibold"
            :class="selectedRigId === rig.id ? 'text-emerald-400' : 'text-text-primary'"
            :title="rig.name"
          >
            {{ rig.name }}
          </span>
          <Badge
            v-if="rig.calibrated"
            size="sm"
            variant="success"
            class="h-4 px-1 text-[10px] uppercase font-bold"
          >
            ✓
          </Badge>
        </div>
      </Button>

      <div
        v-if="rigs.length === 0"
        class="flex h-20 items-center justify-center text-xs text-text-muted italic px-4"
      >
        Aucun corps configuré dans ce catalogue.
      </div>
    </div>
  </div>
</template>
