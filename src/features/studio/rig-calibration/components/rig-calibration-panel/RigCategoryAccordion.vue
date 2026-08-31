<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionRoot,
  AccordionTrigger
} from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { Heading } from '@/components/ui/heading'
import { Switch } from '@/components/ui/switch'
import type { RigConfigurableCategory } from '../../rig-catalog.types'
import type { RigCalibrationCategoryConfig, RigCalibrationPanelValue } from './types'
import RigCategoryEditor from './RigCategoryEditor.vue'

const props = defineProps<{
  categories: RigCalibrationCategoryConfig[]
  activeCategory?: RigConfigurableCategory
  busy: boolean
}>()

const emit = defineEmits<{
  (event: 'toggleCategory', category: RigConfigurableCategory): void
  (event: 'toggleCategoryEnabled', category: RigConfigurableCategory, enabled: boolean): void
  (event: 'selectPart', category: RigConfigurableCategory, assetId: string): void
  (event: 'toggleCompatible', category: RigConfigurableCategory, compatible: boolean): void
  (event: 'setDefaultPart', category: RigConfigurableCategory): void
  (event: 'updateValue', category: RigConfigurableCategory, value: RigCalibrationPanelValue): void
  (event: 'savePart', category: RigConfigurableCategory): void
  (event: 'resetPart', category: RigConfigurableCategory): void
  (event: 'applyAll', category: RigConfigurableCategory): void
  (event: 'auto', category: RigConfigurableCategory): void
}>()

const openCategory = ref<string | undefined>(
  props.activeCategory ?? props.categories[0]?.category
)

watch(
  () => props.activeCategory,
  (category) => {
    if (category && category !== openCategory.value) openCategory.value = category
  }
)

function updateOpenCategory(value: string | undefined): void {
  openCategory.value = value
  if (value) emit('toggleCategory', value as RigConfigurableCategory)
}

function forwardSelectPart(category: RigConfigurableCategory, assetId: string): void {
  emit('selectPart', category, assetId)
}

function forwardToggleCompatible(category: RigConfigurableCategory, compatible: boolean): void {
  emit('toggleCompatible', category, compatible)
}

function forwardUpdateValue(category: RigConfigurableCategory, value: RigCalibrationPanelValue): void {
  emit('updateValue', category, value)
}
</script>

<template>
  <section data-tour="rig-accordion-categories" class="space-y-2" aria-labelledby="rig-parts-title">
    <div class="flex items-center justify-between px-1">
      <Heading id="rig-parts-title" as="h2" variant="sm" color="muted" class="text-[10px] font-bold uppercase tracking-wider">
        2. Sous-pièces du personnage
      </Heading>
      <span class="font-mono text-[10px] text-text-muted">
        {{ categories.filter((category) => category.enabled).length }}/{{ categories.length }} actives
      </span>
    </div>

    <AccordionRoot
      type="single"
      collapsible
      :model-value="openCategory"
      class="space-y-2"
      @update:model-value="updateOpenCategory($event as string | undefined)"
    >
      <AccordionItem
        v-for="category in categories"
        :key="category.category"
        :value="category.category"
        class="overflow-hidden rounded-xl border border-border-default bg-bg-surface transition-colors duration-300 ease-out data-[state=open]:border-primary/50 data-[state=open]:shadow-sm"
      >
        <AccordionHeader class="flex items-center">
          <AccordionTrigger
            class="group flex min-w-0 flex-1 items-center gap-2 p-2.5 text-left outline-none transition-colors hover:bg-bg-muted focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-lg border text-xs"
              :style="{
                backgroundColor: `${category.color}20`,
                borderColor: `${category.color}40`,
                color: category.color
              }"
            >
              <Icon :name="category.icon" size="xs" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1 truncate text-xs font-semibold">{{ category.label }}</span>
            <Icon name="expand_more" size="xs" class="shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-180" aria-hidden="true" />
          </AccordionTrigger>
          <div class="pr-2.5">
            <Switch
              :model-value="category.enabled"
              size="sm"
              :aria-label="`Activer la catégorie ${category.label}`"
              @update:model-value="emit('toggleCategoryEnabled', category.category, Boolean($event))"
            />
          </div>
        </AccordionHeader>

        <AccordionContent class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <RigCategoryEditor
            :category="category"
            :busy="busy"
            @select-part="forwardSelectPart"
            @toggle-compatible="forwardToggleCompatible"
            @set-default-part="emit('setDefaultPart', $event)"
            @update-value="forwardUpdateValue"
            @save-part="emit('savePart', $event)"
            @reset-part="emit('resetPart', $event)"
            @apply-all="emit('applyAll', $event)"
            @auto="emit('auto', $event)"
          />
        </AccordionContent>
      </AccordionItem>
    </AccordionRoot>
  </section>
</template>
