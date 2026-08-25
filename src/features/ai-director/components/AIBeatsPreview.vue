<script setup lang="ts">
import type { AIScriptBeat } from '@core/types/ai.types'
import { ASSET_CATEGORIES } from '@core/constants/categories'
import { formatTimecode } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'

defineProps<{
  beats: AIScriptBeat[]
}>()
</script>

<template>
  <div class="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
    <div
      v-for="(beat, idx) in beats"
      :key="idx"
      class="p-2 rounded-lg border border-border/40 bg-surface/50 text-xs flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-2">
        <span class="font-mono text-[11px] text-primary font-semibold px-1.5 py-0.5 rounded bg-primary/10">
          {{ formatTimecode(beat.timeMs) }}
        </span>
        <div class="flex items-center gap-1">
          <Icon
            :name="ASSET_CATEGORIES[beat.targetSlot]?.icon || 'layers'"
            size="xs"
            class="text-muted-foreground"
          />
          <span class="font-medium text-foreground">{{ beat.action }}</span>
        </div>
      </div>

      <div class="flex items-center gap-1.5">
        <Badge v-if="beat.suggestedTag" variant="accent" size="sm" class="text-[10px]">
          #{{ beat.suggestedTag }}
        </Badge>
        <Badge variant="neutral" size="sm" class="text-[10px] uppercase">
          {{ beat.targetSlot }}
        </Badge>
      </div>
    </div>
  </div>
</template>
