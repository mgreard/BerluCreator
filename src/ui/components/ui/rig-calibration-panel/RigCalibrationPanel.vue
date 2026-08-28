<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select, type SelectOption } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/utils/cn'
import type {
  RigCalibrationPanelEmits,
  RigCalibrationPanelProps,
  RigCalibrationPanelValue
} from './types'

const {
  characterName,
  canvasLabel,
  rigs,
  selectedRigId = undefined,
  categories,
  selectedCategory = undefined,
  categoryEnabled = true,
  items,
  selectedItemId = undefined,
  heritageState = 'undefined',
  value,
  busy = false,
  canDuplicate = false,
  class: className = undefined
} = defineProps<RigCalibrationPanelProps>()

const emit = defineEmits<RigCalibrationPanelEmits>()
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const fieldId = useId()

const rigOptions = computed<SelectOption[]>(() =>
  rigs.map((rig) => ({
    value: rig.id,
    label: rig.isDefault ? `${rig.label} · base` : rig.label
  }))
)

const categoryOptions = computed<SelectOption[]>(() =>
  categories.map((category) => ({
    value: category.value,
    label: category.enabled ? category.label : `${category.label} (désactivée)`
  }))
)

const assetOptions = computed<SelectOption[]>(() =>
  items.map((item) => ({
    value: item.id,
    label: `${item.compatible ? '✓' : '○'} ${item.label}${item.hasOverride ? ' ✎' : ''}`
  }))
)

const selectedItem = computed(() => items.find((item) => item.id === selectedItemId))
const selectedRig = computed(() => rigs.find((rig) => rig.id === selectedRigId))

const isPlacementDisabled = computed(
  () => !categoryEnabled || !selectedItem.value || !selectedItem.value.compatible || busy
)

const heritageBadgeConfig = computed<{
  label: string
  variant: 'accent' | 'neutral' | 'warning'
}>(() => {
  switch (heritageState) {
    case 'template':
      return { label: 'Template de la catégorie', variant: 'accent' }
    case 'inherited':
      return { label: 'Valeurs héritées de la catégorie', variant: 'neutral' }
    case 'custom':
      return { label: 'Valeurs personnalisées', variant: 'warning' }
    case 'undefined':
    default:
      return { label: 'Template non défini', variant: 'neutral' }
  }
})

function updateField(field: keyof RigCalibrationPanelValue, next: string | number): void {
  const number = Number(next)
  if (!Number.isFinite(number)) return
  emit('update:value', { ...value, [field]: number })
}

function emitString(event: 'select-rig' | 'select-category' | 'select', val: unknown): void {
  if (typeof val !== 'string') return
  if (event === 'select-rig') emit('select-rig', val)
  else if (event === 'select-category') emit('select-category', val)
  else emit('select', val)
}

function handleFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('import', file)
  input.value = ''
}
</script>

<template>
  <aside
    :class="
      cn(
        'flex h-full w-full flex-col overflow-hidden border-l border-border-subtle bg-bg-surface/95 text-text-primary',
        className
      )
    "
    aria-label="Calibration globale des rigs"
  >
    <header class="shrink-0 border-b border-border-subtle p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm font-semibold">
            <Icon name="construction" size="sm" class="text-primary" />
            <span>Rigs de {{ characterName }}</span>
          </div>
          <p class="mt-1 text-[10px] leading-relaxed text-text-muted">
            Corps racine · repère {{ canvasLabel }} · sauvegarde automatique
          </p>
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

    <div class="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3">
      <!-- Section 1 : Corps et rig -->
      <section class="space-y-2.5 rounded-xl border border-border-subtle bg-bg-elevated/50 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
            >1. Corps et rig</span
          >
          <Badge v-if="selectedRig?.isDefault" variant="accent" size="sm"
            >Configuration de base</Badge
          >
        </div>
        <label :for="`${fieldId}-rig`" class="block text-xs font-semibold">
          Corps principal
          <Select
            :id="`${fieldId}-rig`"
            :model-value="selectedRigId"
            :options="rigOptions"
            size="sm"
            class="mt-1"
            :content-z-index="1600"
            aria-label="Corps principal du rig"
            @change="emitString('select-rig', $event)"
          />
        </label>
        <p class="text-[10px] text-text-muted">{{ selectedRig?.bodyLabel }}</p>
        <div class="grid grid-cols-1 gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            class="w-full"
            :disabled="busy || selectedRig?.isDefault"
            @click="emit('set-default-rig')"
          >
            <Icon name="home" size="xs" /> Utiliser comme base de l’app
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="w-full border border-border-subtle"
            :disabled="busy || !canDuplicate"
            @click="emit('open-duplicate')"
          >
            <Icon name="content_copy" size="xs" /> Copier la configuration depuis un autre rig
          </Button>
        </div>
      </section>

      <!-- Section 2 : Collection compatible -->
      <section class="space-y-3 rounded-xl border border-border-subtle bg-bg-elevated/50 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
            >2. Collection compatible</span
          >
        </div>

        <label class="block text-xs font-semibold">
          Type d’élément
          <Select
            :model-value="selectedCategory"
            :options="categoryOptions"
            size="sm"
            class="mt-1"
            :content-z-index="1600"
            aria-label="Type d’élément du rig"
            @change="emitString('select-category', $event)"
          />
        </label>

        <div class="rounded-lg border border-border-subtle bg-bg-base/30 p-2.5 space-y-2">
          <Switch
            :model-value="categoryEnabled"
            size="sm"
            label="Utiliser cette catégorie dans ce rig"
            description="Désactiver si cette partie est déjà intégrée au corps."
            @update:model-value="emit('toggle-category', $event)"
          />
        </div>

        <div v-if="!categoryEnabled" class="rounded-lg border border-border-subtle bg-bg-surface/50 p-3 text-center">
          <p class="text-[11px] text-text-muted">
            Cette catégorie est désactivée pour ce corps. Les sprites associés sont ignorés dans ce rig.
          </p>
        </div>

        <template v-else>
          <label class="block text-xs font-semibold">
            Sprite
            <Select
              :model-value="selectedItemId"
              :options="assetOptions"
              size="sm"
              class="mt-1"
              :content-z-index="1600"
              aria-label="Sprite à calibrer"
              @change="emitString('select', $event)"
            />
          </label>

          <div
            v-if="selectedItem"
            class="space-y-2 rounded-lg border border-border-subtle bg-bg-base/30 p-2.5"
          >
            <div class="flex items-center justify-between gap-2 text-[10px] text-text-muted">
              <span>{{ selectedItem.dimensions }}</span>
              <Badge v-if="selectedItem.isDefault" variant="accent" size="sm">Défaut du slot</Badge>
            </div>
            <Switch
              :model-value="selectedItem.compatible"
              size="sm"
              label="Compatible avec ce corps"
              description="Une pièce peut être compatible avec plusieurs rigs."
              @update:model-value="emit('toggle-compatible', $event)"
            />
            <Button
              size="sm"
              variant="ghost"
              class="w-full"
              :disabled="busy || !selectedItem.compatible || selectedItem.isDefault"
              @click="emit('set-default-part')"
            >
              Définir comme élément par défaut
            </Button>
          </div>
        </template>
      </section>

      <!-- Section 3 : Placement sur le corps -->
      <section class="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
            >3. Placement sur le corps</span
          >
          <Badge :variant="heritageBadgeConfig.variant" size="sm">
            {{ heritageBadgeConfig.label }}
          </Badge>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-semibold">X</span>
              <IconButton
                icon="content_copy"
                size="xs"
                variant="ghost"
                :disabled="isPlacementDisabled"
                aria-label="Appliquer X à tous les sprites de cette catégorie"
                title="Appliquer X à tous les sprites de cette catégorie"
                @click="emit('duplicate-field', 'x')"
              />
            </div>
            <Input
              :model-value="value.x"
              type="number"
              size="sm"
              step="1"
              :disabled="isPlacementDisabled"
              @update:model-value="updateField('x', $event)"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-semibold">Y</span>
              <IconButton
                icon="content_copy"
                size="xs"
                variant="ghost"
                :disabled="isPlacementDisabled"
                aria-label="Appliquer Y à tous les sprites de cette catégorie"
                title="Appliquer Y à tous les sprites de cette catégorie"
                @click="emit('duplicate-field', 'y')"
              />
            </div>
            <Input
              :model-value="value.y"
              type="number"
              size="sm"
              step="1"
              :disabled="isPlacementDisabled"
              @update:model-value="updateField('y', $event)"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-semibold">Échelle</span>
              <IconButton
                icon="content_copy"
                size="xs"
                variant="ghost"
                :disabled="isPlacementDisabled"
                aria-label="Appliquer l’échelle à tous les sprites de cette catégorie"
                title="Appliquer l’échelle à tous les sprites de cette catégorie"
                @click="emit('duplicate-field', 'scale')"
              />
            </div>
            <Input
              :model-value="value.scale"
              type="number"
              size="sm"
              step="0.01"
              min="0.01"
              :disabled="isPlacementDisabled"
              @update:model-value="updateField('scale', $event)"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-semibold">Rotation</span>
              <IconButton
                icon="content_copy"
                size="xs"
                variant="ghost"
                :disabled="isPlacementDisabled"
                aria-label="Appliquer la rotation à tous les sprites de cette catégorie"
                title="Appliquer la rotation à tous les sprites de cette catégorie"
                @click="emit('duplicate-field', 'rotation')"
              />
            </div>
            <Input
              :model-value="value.rotation"
              type="number"
              size="sm"
              step="1"
              :disabled="isPlacementDisabled"
              @update:model-value="updateField('rotation', $event)"
            />
          </div>

          <div class="col-span-2 space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-semibold">Z-index</span>
              <IconButton
                icon="content_copy"
                size="xs"
                variant="ghost"
                :disabled="isPlacementDisabled"
                aria-label="Appliquer le z-index à tous les sprites de cette catégorie"
                title="Appliquer le z-index à tous les sprites de cette catégorie"
                @click="emit('duplicate-field', 'zIndex')"
              />
            </div>
            <Input
              :model-value="value.zIndex"
              type="number"
              size="sm"
              step="1"
              :disabled="isPlacementDisabled"
              @update:model-value="updateField('zIndex', $event)"
            />
          </div>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="secondary"
            :disabled="isPlacementDisabled"
            @click="emit('auto')"
            ><Icon name="auto_fix_high" size="xs" /> Auto</Button
          >
          <Button
            size="sm"
            variant="ghost"
            :disabled="isPlacementDisabled || heritageState !== 'custom'"
            @click="emit('reset')"
            >Réinitialiser</Button
          >
          <Button
            size="sm"
            variant="primary"
            :loading="busy"
            :disabled="isPlacementDisabled"
            @click="emit('save')"
            >Enregistrer</Button
          >
        </div>
      </section>
    </div>

    <footer class="shrink-0 border-t border-border-subtle bg-bg-elevated/70 p-3">
      <input
        ref="fileInput"
        type="file"
        accept="application/json,.json"
        class="sr-only"
        @change="handleFile"
      />
      <div class="grid grid-cols-2 gap-2">
        <Button size="sm" variant="ghost" :disabled="busy" @click="fileInput?.click()"
          ><Icon name="upload_file" size="xs" /> Importer</Button
        >
        <Button size="sm" variant="secondary" :disabled="busy" @click="emit('export')"
          ><Icon name="download" size="xs" /> Exporter tout</Button
        >
      </div>
    </footer>
  </aside>
</template>
