<script setup lang="ts">
import { ref, useId, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { cn } from '@/shared/utils/cn'
import type { RigCalibrationPanelEmits, RigCalibrationPanelProps } from './types'
import type { RigConfigurableCategory } from '../../rig-catalog.types'
import type { RigCalibrationPanelValue } from './types'
import RigBodyDisclosure from './RigBodyDisclosure.vue'
import RigCategoryAccordion from './RigCategoryAccordion.vue'

const {
  characterName,
  canvasLabel,
  rigs = [],
  selectedRigId = undefined,
  bodyOrigin = { x: 0, y: 0 },
  isEditingOrigin = false,
  categories = [],
  activeCategory = undefined,
  busy = false,
  canDuplicate = false,
  class: className = undefined
} = defineProps<RigCalibrationPanelProps>()

const emit = defineEmits<RigCalibrationPanelEmits>()
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const panelId = useId()
const isBodySectionOpen = ref(false)

function handleFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('import', file)
  input.value = ''
}

function forwardCategoryEnabled(category: RigConfigurableCategory, enabled: boolean): void {
  emit('toggle-category-enabled', category, enabled)
}

function forwardSelectPart(category: RigConfigurableCategory, assetId: string): void {
  emit('select-part', category, assetId)
}

function forwardCompatibility(category: RigConfigurableCategory, compatible: boolean): void {
  emit('toggle-compatible', category, compatible)
}

function forwardValue(category: RigConfigurableCategory, value: RigCalibrationPanelValue): void {
  emit('update:value', category, value)
}
</script>

<template>
  <aside
    :class="
      cn('flex h-full w-full flex-col overflow-hidden bg-bg-surface text-text-primary', className)
    "
    :aria-labelledby="`${panelId}-title`"
  >
    <header class="shrink-0 border-b border-border-default bg-bg-elevated p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <Heading
            :id="`${panelId}-title`"
            as="h1"
            variant="sm"
            color="inherit"
            class="flex items-center gap-2 text-sm font-semibold"
          >
            <Icon name="person" size="sm" class="text-primary" aria-hidden="true" />
            <span>Rig {{ characterName }}</span>
          </Heading>
          <Text
            :id="`${panelId}-description`"
            as="p"
            variant="caption"
            color="muted"
            class="mt-0.5 text-[10px] leading-relaxed"
          >
            Assemblage & Calibration Multi-Catégories · {{ canvasLabel }}
          </Text>
        </div>
        <IconButton
          icon="close"
          size="sm"
          variant="ghost"
          aria-label="Fermer et sauvegarder"
          @click="emit('close')"
        />
      </div>
    </header>

    <div class="custom-scrollbar flex-1 space-y-3.5 overflow-y-auto bg-bg-surface p-3">
      <RigBodyDisclosure
        v-model:open="isBodySectionOpen"
        :rigs="rigs"
        :selected-rig-id="selectedRigId"
        :body-origin="bodyOrigin"
        :is-editing-origin="isEditingOrigin"
        @select-rig="emit('select-rig', $event)"
        @set-default-rig="emit('set-default-rig')"
        @edit-origin="emit('edit-origin')"
        @reset-origin="emit('reset-origin')"
      />

      <RigCategoryAccordion
        :categories="categories"
        :active-category="activeCategory"
        :busy="busy"
        @toggle-category="emit('toggle-category', $event)"
        @toggle-category-enabled="forwardCategoryEnabled"
        @select-part="forwardSelectPart"
        @toggle-compatible="forwardCompatibility"
        @set-default-part="emit('set-default-part', $event)"
        @update-value="forwardValue"
        @save-part="emit('save-part', $event)"
        @reset-part="emit('reset-part', $event)"
        @apply-all="emit('apply-all', $event)"
        @auto="emit('auto', $event)"
      />
    </div>

    <footer
      class="shrink-0 space-y-2 border-t border-border-default bg-bg-elevated p-3"
      aria-label="Actions du calibreur"
    >
      <Button
        v-if="canDuplicate"
        size="xs"
        variant="secondary"
        class="w-full"
        @click="emit('open-duplicate')"
      >
        <Icon name="content_copy" size="xs" />
        <span>Copier la configuration depuis un rig...</span>
      </Button>

      <div class="flex items-center justify-between gap-2">
        <div
          class="flex items-center gap-1"
          role="group"
          aria-label="Import et export du catalogue"
        >
          <IconButton
            icon="download"
            size="xs"
            variant="ghost"
            title="Exporter le catalogue JSON des rigs"
            aria-label="Exporter le catalogue JSON des rigs"
            @click="emit('export')"
          />
          <IconButton
            icon="upload"
            size="xs"
            variant="ghost"
            title="Importer un catalogue JSON de rigs"
            aria-label="Importer un catalogue JSON de rigs"
            @click="fileInput?.click()"
          />
          <!-- eslint-disable-next-line vue/no-restricted-html-elements -- sélecteur de fichier natif caché -->
          <input
            ref="fileInput"
            type="file"
            accept=".json,application/json"
            class="hidden"
            @change="handleFile"
          />
        </div>

        <Button size="sm" variant="primary" @click="emit('close')">
          <Icon name="check" size="xs" />
          <span>Terminer</span>
        </Button>
      </div>
    </footer>
  </aside>
</template>
