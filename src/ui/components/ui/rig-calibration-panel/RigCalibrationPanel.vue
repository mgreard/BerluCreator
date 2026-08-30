<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { Select, type SelectOption } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/shared/utils/cn'
import type { RigConfigurableCategory } from '@/features/studio/rig-calibration/rig-catalog.types'
import type {
  RigCalibrationCategoryConfig,
  RigCalibrationHeritageState,
  RigCalibrationPanelEmits,
  RigCalibrationPanelProps,
  RigCalibrationPanelValue
} from './types'

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
const fieldId = useId()

const openCategory = ref<RigConfigurableCategory | null>(
  activeCategory ?? categories?.[0]?.category ?? 'head'
)

const rigOptions = computed<SelectOption[]>(() =>
  (rigs ?? []).map((rig) => ({
    value: rig.id,
    label: rig.isDefault ? `${rig.label} · base` : rig.label
  }))
)

const selectedRig = computed(() => (rigs ?? []).find((rig) => rig.id === selectedRigId))

function toggleAccordion(category: RigConfigurableCategory): void {
  openCategory.value = openCategory.value === category ? null : category
  emit('toggle-category', category)
}

function assetOptionsForCategory(cat: RigCalibrationCategoryConfig): SelectOption[] {
  return (cat?.items ?? []).map((item) => ({
    value: item.id,
    label: `${item.compatible ? '✓' : '○'} ${item.label}${item.hasOverride ? ' (spécifique)' : ''}`
  }))
}

function selectedItemForCategory(cat: RigCalibrationCategoryConfig) {
  return cat?.items?.find((item) => item.id === cat.selectedItemId)
}

function isPlacementDisabled(cat: RigCalibrationCategoryConfig): boolean {
  const item = selectedItemForCategory(cat)
  return !item || !item.compatible || !cat?.enabled || busy
}

function heritageBadgeConfig(state: RigCalibrationHeritageState): {
  label: string
  variant: 'accent' | 'neutral' | 'warning'
} {
  switch (state) {
    case 'template':
      return { label: 'Position commune (défaut)', variant: 'accent' }
    case 'inherited':
      return { label: 'Position commune (héritée)', variant: 'neutral' }
    case 'custom':
      return { label: 'Position spécifique', variant: 'warning' }
    case 'undefined':
    default:
      return { label: 'Non défini', variant: 'neutral' }
  }
}

function updateCategoryField(
  cat: RigCalibrationCategoryConfig,
  field: keyof RigCalibrationPanelValue,
  next: string | number
): void {
  const number = Number(next)
  if (!Number.isFinite(number)) return
  emit('update:value', cat.category, { ...cat.value, [field]: number })
}

function emitSelectedRig(val: unknown): void {
  if (typeof val !== 'string') return
  emit('select-rig', val)
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
    aria-label="Éditeur de rig du personnage"
  >
    <!-- En-tête -->
    <header class="shrink-0 border-b border-border-subtle p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 text-sm font-semibold">
            <Icon name="person" size="sm" class="text-primary" />
            <span>Rig {{ characterName }}</span>
          </div>
          <p class="mt-0.5 text-[10px] leading-relaxed text-text-muted">
            Assemblage & Calibration Multi-Catégories · {{ canvasLabel }}
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

    <div class="custom-scrollbar flex-1 space-y-3.5 overflow-y-auto p-3">
      <!-- Section 1 : Corps & Origine -->
      <section class="space-y-2.5 rounded-xl border border-border-subtle bg-bg-elevated/50 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
            >1. Corps & Origine</span
          >
          <Badge v-if="selectedRig?.isDefault" variant="accent" size="sm">Rig de base</Badge>
        </div>

        <label :for="`${fieldId}-rig`" class="block text-xs font-semibold">
          Sprite Corps
          <Select
            :id="`${fieldId}-rig`"
            :model-value="selectedRigId"
            :options="rigOptions"
            size="sm"
            class="mt-1"
            aria-label="Corps principal du rig"
            @update:model-value="emitSelectedRig"
          />
        </label>

        <!-- Origine du corps -->
        <div class="rounded-lg border border-border-subtle/80 bg-bg-surface/60 p-2.5 text-xs space-y-2">
          <div class="flex items-center justify-between text-text-muted">
            <span class="font-medium text-text-secondary">Point d’ancrage (Origine) :</span>
            <span class="font-mono text-[11px] font-semibold text-text-primary">
              X: {{ bodyOrigin.x }}px, Y: {{ bodyOrigin.y }}px
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button
              size="xs"
              :variant="isEditingOrigin ? 'primary' : 'secondary'"
              class="flex-1"
              @click="emit('edit-origin')"
            >
              <Icon name="pin_drop" size="xs" />
              <span>{{ isEditingOrigin ? 'Origine active' : 'Ajuster l’origine' }}</span>
            </Button>
            <Button
              size="xs"
              variant="ghost"
              title="Recentrer l’origine au milieu du corps"
              @click="emit('reset-origin')"
            >
              <Icon name="center_focus_strong" size="xs" />
              <span>Centrer</span>
            </Button>
          </div>
        </div>

        <Button
          v-if="selectedRig && !selectedRig.isDefault"
          size="xs"
          variant="secondary"
          class="w-full"
          @click="emit('set-default-rig')"
        >
          <Icon name="star" size="xs" />
          <span>Définir comme rig par défaut</span>
        </Button>
      </section>

      <!-- Section 2 : Accordéon des Catégories de Sous-Éléments (Têtes, Yeux, Bouches, Accessoires, Bras...) -->
      <div data-tour="rig-accordion-categories" class="space-y-2">
        <div class="flex items-center justify-between px-1">
          <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
            2. Sous-pièces du personnage
          </span>
          <span class="font-mono text-[10px] text-text-muted">
            {{ (categories ?? []).filter((c) => c.enabled).length }}/{{ (categories ?? []).length }} actives
          </span>
        </div>

        <div
          v-for="cat in (categories ?? [])"
          :key="cat.category"
          class="rounded-xl border transition-colors overflow-hidden"
          :class="[
            openCategory === cat.category
              ? 'border-primary/50 bg-bg-elevated/70 shadow-glass-xs'
              : 'border-border-subtle bg-bg-elevated/30 hover:border-border-default'
          ]"
        >
          <!-- En-tête de section accordéon -->
          <div
            class="flex items-center justify-between p-2.5 cursor-pointer select-none transition-colors"
            @click="toggleAccordion(cat.category)"
          >
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="flex size-6 shrink-0 items-center justify-center rounded-lg border text-xs"
                :style="{
                  backgroundColor: `${cat.color}20`,
                  borderColor: `${cat.color}40`,
                  color: cat.color
                }"
              >
                <Icon :name="cat.icon" size="xs" />
              </div>
              <span class="font-semibold text-xs truncate">{{ cat.label }}</span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0" @click.stop>
              <!-- Switch activation de catégorie -->
              <Switch
                :model-value="cat.enabled"
                size="sm"
                :aria-label="`Activer la catégorie ${cat.label}`"
                @update:model-value="emit('toggle-category-enabled', cat.category, Boolean($event))"
              />
              <IconButton
                :icon="openCategory === cat.category ? 'expand_less' : 'expand_more'"
                size="xs"
                variant="ghost"
                :aria-label="openCategory === cat.category ? 'Replier' : 'Déplier'"
                @click="toggleAccordion(cat.category)"
              />
            </div>
          </div>

          <!-- Contenu de la catégorie dépliée -->
          <div
            v-if="openCategory === cat.category"
            class="border-t border-border-subtle/80 p-3 space-y-3 bg-bg-surface/40"
          >
            <!-- 1. Sélecteur de Sprite -->
            <label :for="`${fieldId}-${cat.category}`" class="block text-xs font-semibold">
              Sprite sélectionné
              <Select
                :id="`${fieldId}-${cat.category}`"
                :model-value="cat.selectedItemId"
                :options="assetOptionsForCategory(cat)"
                :disabled="!cat.enabled"
                size="sm"
                class="mt-1"
                :aria-label="`Sprite pour ${cat.label}`"
                @update:model-value="emit('select-part', cat.category, String($event))"
              />
            </label>

            <!-- 2. Compatibilité & Pièce par défaut -->
            <div
              v-if="selectedItemForCategory(cat)"
              class="flex items-center justify-between rounded-lg border border-border-subtle/80 bg-bg-surface/60 p-2.5"
            >
              <div class="flex items-center gap-2">
                <Switch
                  :id="`${fieldId}-${cat.category}-compat`"
                  :model-value="selectedItemForCategory(cat)?.compatible ?? false"
                  :disabled="!cat.enabled"
                  size="sm"
                  :aria-label="`Compatibilité de la pièce ${cat.label}`"
                  @update:model-value="emit('toggle-compatible', cat.category, Boolean($event))"
                />
                <label
                  :for="`${fieldId}-${cat.category}-compat`"
                  class="text-xs font-medium cursor-pointer"
                >
                  Compatible
                </label>
              </div>

              <Button
                v-if="selectedItemForCategory(cat)?.compatible && !selectedItemForCategory(cat)?.isDefault"
                size="xs"
                variant="ghost"
                :disabled="!cat.enabled"
                title="Définir comme pièce par défaut pour cette catégorie"
                @click="emit('set-default-part', cat.category)"
              >
                <Icon name="bookmark" size="xs" />
                <span>Définir par défaut</span>
              </Button>
            </div>

            <!-- 3. Positionnement Relatif -->
            <div data-tour="rig-transform-controls" class="space-y-2 rounded-lg border border-border-subtle/80 bg-bg-surface/60 p-2.5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-text-muted"
                  >Position relative</span
                >
                <Badge :variant="heritageBadgeConfig(cat.heritageState).variant" size="sm">
                  {{ heritageBadgeConfig(cat.heritageState).label }}
                </Badge>
              </div>

              <!-- Indicateur d'élément -->
              <div class="text-[11px] font-medium text-text-secondary bg-bg-surface/80 px-2.5 py-1 rounded border border-border-subtle flex items-center justify-between">
                <span class="truncate">Configuration : <strong>{{ selectedItemForCategory(cat)?.label || 'Élément' }}</strong></span>
                <span v-if="selectedItemForCategory(cat)?.hasOverride" class="text-accent font-semibold text-[10px]">Personnalisé</span>
                <span v-else class="text-text-muted text-[10px]">Standard</span>
              </div>

              <!-- Champs de coordonnées & dimensions -->
              <div class="grid grid-cols-2 gap-2 text-xs">
                <label class="block">
                  <span class="text-[11px] font-medium text-text-muted">Décalage X (px)</span>
                  <Input
                    type="number"
                    :model-value="cat.value.x"
                    :disabled="isPlacementDisabled(cat)"
                    size="sm"
                    class="mt-1"
                    @update:model-value="updateCategoryField(cat, 'x', $event)"
                  />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium text-text-muted">Décalage Y (px)</span>
                  <Input
                    type="number"
                    :model-value="cat.value.y"
                    :disabled="isPlacementDisabled(cat)"
                    size="sm"
                    class="mt-1"
                    @update:model-value="updateCategoryField(cat, 'y', $event)"
                  />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium text-text-muted">Échelle</span>
                  <Input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="4"
                    :model-value="cat.value.scale"
                    :disabled="isPlacementDisabled(cat)"
                    size="sm"
                    class="mt-1"
                    @update:model-value="updateCategoryField(cat, 'scale', $event)"
                  />
                </label>
                <label class="block">
                  <span class="text-[11px] font-medium text-text-muted">Rotation (°)</span>
                  <Input
                    type="number"
                    step="1"
                    min="-180"
                    max="180"
                    :model-value="cat.value.rotation"
                    :disabled="isPlacementDisabled(cat)"
                    size="sm"
                    class="mt-1"
                    @update:model-value="updateCategoryField(cat, 'rotation', $event)"
                  />
                </label>
                <label class="block col-span-2">
                  <span class="text-[11px] font-medium text-text-muted">Profondeur (Z-index)</span>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    :model-value="cat.value.zIndex ?? 10"
                    :disabled="isPlacementDisabled(cat)"
                    size="sm"
                    class="mt-1"
                    @update:model-value="updateCategoryField(cat, 'zIndex', $event)"
                  />
                </label>
              </div>

              <!-- Bouton Sauvegarder explicite -->
              <Button
                data-tour="rig-save-btn"
                size="sm"
                variant="primary"
                class="w-full font-semibold shadow-glass-xs"
                :disabled="isPlacementDisabled(cat)"
                @click="emit('save-part', cat.category)"
              >
                <Icon name="save" size="xs" />
                <span>Sauvegarder {{ selectedItemForCategory(cat)?.label || 'la position' }}</span>
              </Button>

              <!-- Actions rapides de positionnement -->
              <div class="flex flex-col gap-1.5 pt-1">
                <Button
                  v-if="selectedItemForCategory(cat)?.hasOverride"
                  size="xs"
                  variant="ghost"
                  class="w-full text-warning hover:bg-warning/10"
                  @click="emit('reset-part', cat.category)"
                >
                  <Icon name="restart_alt" size="xs" />
                  <span>Revenir à la position commune</span>
                </Button>

                <div class="flex items-center gap-2">
                  <Button
                    data-tour="rig-apply-all"
                    size="xs"
                    variant="secondary"
                    class="flex-1"
                    :disabled="isPlacementDisabled(cat)"
                    title="Appliquer cette position commune à toutes les pièces de cette catégorie"
                    @click="emit('apply-all', cat.category)"
                  >
                    <Icon name="done_all" size="xs" />
                    <span>Appliquer à toutes</span>
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    :disabled="isPlacementDisabled(cat)"
                    title="Suggérer un calibrage automatique"
                    @click="emit('auto', cat.category)"
                  >
                    <Icon name="auto_fix_high" size="xs" />
                    <span>Auto</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pied de panneau -->
    <footer class="shrink-0 border-t border-border-subtle p-3 space-y-2">
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
        <div class="flex items-center gap-1">
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
