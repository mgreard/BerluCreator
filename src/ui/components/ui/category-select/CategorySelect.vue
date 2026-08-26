<script setup lang="ts">
import { computed, useId } from 'vue'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectViewport
} from 'reka-ui'
import { CATEGORY_LIST, ASSET_CATEGORIES } from '@core/constants/categories'
import type { AssetCategory } from '@core/types/asset.types'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { CategorySelectEmits, CategorySelectProps } from './types'

const model = defineModel<AssetCategory>({ required: true })
const {
  id = undefined,
  label = 'Catégorie de sprite',
  disabled = false,
  contentZIndex = 1300,
  class: className = undefined
} = defineProps<CategorySelectProps>()
const emit = defineEmits<CategorySelectEmits>()
const generatedId = useId()
const triggerId = computed(() => id ?? generatedId)
const selected = computed(() => ASSET_CATEGORIES[model.value])

function selectCategory(value: string) {
  if (!(value in ASSET_CATEGORIES)) return
  model.value = value as AssetCategory
  emit('change', model.value)
}
</script>

<template>
  <SelectRoot :model-value="model" :disabled="disabled" @update:model-value="selectCategory(String($event))">
    <SelectTrigger
      :id="triggerId"
      :aria-label="label"
      :class="cn(
        'inline-flex min-h-[44px] w-full touch-manipulation items-center justify-between rounded-xl border border-border-default bg-bg-elevated px-3.5 py-2 text-sm text-text-primary shadow-glass-xs outline-none transition-all hover:border-border-hover hover:bg-bg-surface-hover focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50',
        className
      )"
    >
      <SelectValue>
        <span class="flex min-w-0 items-center gap-2">
          <span class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: selected.color }" />
          <Icon :name="selected.icon" size="xs" :style="{ color: selected.color }" />
          <span class="truncate font-semibold">{{ selected.label }}</span>
        </span>
      </SelectValue>
      <Icon name="expand_more" size="xs" class="ml-2 shrink-0 text-text-muted" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="min-w-[var(--reka-select-trigger-width)] overflow-hidden rounded-xl border border-border-default bg-bg-elevated text-text-primary shadow-glass-lg"
        :style="{ zIndex: contentZIndex }"
      >
        <SelectViewport class="max-h-72 p-1">
          <SelectItem
            v-for="category in CATEGORY_LIST"
            :key="category.id"
            :value="category.id"
            class="relative flex min-h-[44px] cursor-pointer select-none items-center rounded-lg px-3 outline-none transition-colors data-[highlighted]:bg-bg-surface-hover"
          >
            <SelectItemText>
              <span class="flex items-center gap-2.5">
                <span class="size-2.5 rounded-full" :style="{ backgroundColor: category.color }" />
                <Icon :name="category.icon" size="xs" :style="{ color: category.color }" />
                <span>{{ category.label }}</span>
              </span>
            </SelectItemText>
            <SelectItemIndicator class="ml-auto text-primary">
              <Icon name="check" size="xs" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
