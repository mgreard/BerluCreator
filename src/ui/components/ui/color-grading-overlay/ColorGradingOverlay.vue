<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import { cn } from '@/shared/utils/cn'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { useBoundedFloatingPanel } from '@/shared/composables/useBoundedFloatingPanel'
import {
  COLOR_GRADING_PRESET_CONFIGS,
  DEFAULT_COLOR_GRADING_SETTINGS
} from '@core/constants/editor'
import type {
  ColorGradingAdjustments,
  ColorGradingOverlayEmits,
  ColorGradingOverlayProps,
  ColorGradingPreset,
  ColorGradingPresetItem,
  ColorGradingSettings
} from './types'

const PRESETS: ColorGradingPresetItem[] = [
  { id: 'neutral', label: 'Neutre', icon: 'wb_sunny' },
  { id: 'warm', label: 'Chaud', icon: 'local_fire_department' },
  { id: 'golden_hour', label: 'Golden hour', icon: 'flare' },
  { id: 'studio', label: 'Studio', icon: 'videocam' },
  { id: 'night', label: 'Nuit', icon: 'dark_mode' },
  { id: 'cartoon_punch', label: 'Cartoon punch', icon: 'auto_awesome' }
]

const model = defineModel<ColorGradingSettings>({ required: true })
const open = defineModel<boolean>('open', { default: true })

const { class: className = undefined } = defineProps<ColorGradingOverlayProps>()
const emit = defineEmits<ColorGradingOverlayEmits>()

const panelRef = useTemplateRef<HTMLElement>('panel')
const titleId = useId()
const showAdvanced = ref(false)

const floatingPanel = useBoundedFloatingPanel(
  ref(null),
  panelRef,
  { right: '12px', top: '12px' },
  8
)

function updateSettings(changes: Partial<ColorGradingSettings>) {
  const next = { ...model.value, ...changes }
  model.value = next
  emit('update:modelValue', next)
}

function selectPreset(presetId: ColorGradingPreset) {
  if (presetId === 'custom') {
    updateSettings({ preset: 'custom' })
    return
  }

  const config = COLOR_GRADING_PRESET_CONFIGS[presetId]
  updateSettings({
    enabled: true,
    preset: presetId,
    ...config
  })
}

function updateAdjustment(key: keyof ColorGradingAdjustments, value: number | number[]) {
  const numValue = Array.isArray(value) ? (value[0] ?? 0) : value
  updateSettings({
    [key]: numValue,
    preset: 'custom'
  })
}

function handleToggleEnabled(enabled: boolean) {
  updateSettings({ enabled })
}

function resetToDefault() {
  model.value = { ...DEFAULT_COLOR_GRADING_SETTINGS }
  emit('reset')
}

function handleClose() {
  open.value = false
  emit('close')
  emit('update:open', false)
}

function scalarValue(val: number): number {
  return val
}
</script>

<template>
  <section
    v-if="open"
    :id="`${titleId}-panel`"
    ref="panel"
    :class="
      cn(
        'viewport-glass absolute z-50 flex w-88 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-bg-surface/90 text-white/90 shadow-glass-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200',
        !floatingPanel.isDragging.value && 'transition-all duration-300 ease-out',
        className
      )
    "
    :style="floatingPanel.style.value"
    role="region"
    :aria-labelledby="titleId"
    @pointerdown.stop
    @dblclick.stop
  >
    <!-- En-tête -->
    <header class="flex items-center gap-2 border-b border-white/10 bg-black/20 px-3 py-2.5">
      <IconButton
        icon="drag_indicator"
        size="xs"
        variant="ghost"
        class="viewport-action shrink-0 touch-none text-white/60 hover:text-white"
        :class="floatingPanel.isDragging.value ? 'cursor-grabbing' : 'cursor-grab'"
        aria-label="Déplacer le panneau Color Grading"
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
        title="Déplacer le panneau"
        @pointerdown="floatingPanel.beginDrag"
        @pointermove="floatingPanel.moveDrag"
        @pointerup="floatingPanel.endDrag"
        @pointercancel="floatingPanel.endDrag"
        @keydown="floatingPanel.nudge"
      />
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <Icon name="palette" size="sm" class="text-primary shrink-0" />
        <div class="min-w-0 flex-1">
          <Heading :id="titleId" as="h3" variant="sm" class="text-xs font-semibold text-white">
            Color grading global
          </Heading>
          <Text as="p" variant="caption" class="truncate text-[10px] leading-tight text-white/60">
            Harmonise l’ensemble de la scène
          </Text>
        </div>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <Switch
          :model-value="model.enabled"
          size="sm"
          aria-label="Activer le color grading"
          title="Activer/Désactiver"
          @update:model-value="handleToggleEnabled"
        />
        <IconButton
          icon="close"
          size="xs"
          variant="ghost"
          class="viewport-action text-white/60 hover:text-white"
          aria-label="Fermer le panneau"
          title="Fermer"
          @click="handleClose"
        />
      </div>
    </header>

    <!-- Corps du panneau -->
    <div class="flex flex-col gap-3.5 p-3.5 max-h-[75vh] overflow-y-auto">
      <!-- Sélecteur de Presets -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-semibold text-white/80">Ambiance prédéfinie</span>
          <span
            v-if="model.preset === 'custom'"
            class="text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5"
          >
            Personnalisé
          </span>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <button
            v-for="item in PRESETS"
            :key="item.id"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs transition-all touch-manipulation"
            :class="
              model.preset === item.id && model.enabled
                ? 'border-primary/80 bg-primary/20 text-white font-semibold shadow-glass-sm'
                : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
            "
            @click="selectPreset(item.id)"
          >
            <Icon
              v-if="item.icon"
              :name="item.icon"
              size="xs"
              :class="model.preset === item.id && model.enabled ? 'text-primary' : 'text-white/50'"
            />
            <span class="truncate text-[11px]">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <!-- Section repliable : Ajustements avancés -->
      <div class="flex flex-col rounded-xl border border-white/10 bg-black/15 overflow-hidden">
        <button
          type="button"
          class="flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/5 transition-colors touch-manipulation"
          @click="showAdvanced = !showAdvanced"
        >
          <span class="flex items-center gap-1.5">
            <Icon name="tune" size="xs" class="text-white/60" />
            <span>Ajustements avancés</span>
          </span>
          <Icon
            :name="showAdvanced ? 'expand_less' : 'expand_more'"
            size="xs"
            class="text-white/60 transition-transform duration-200"
          />
        </button>

        <div v-if="showAdvanced" class="flex flex-col gap-3.5 p-3 border-t border-white/10 bg-black/10">
          <!-- Exposition -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-white/70">Exposition</span>
              <span class="font-mono text-white/90">{{ model.exposure > 0 ? `+${model.exposure}` : model.exposure }}</span>
            </div>
            <Slider
              :model-value="model.exposure"
              :min="-100"
              :max="100"
              :step="1"
              size="sm"
              variant="gradient"
              aria-label="Exposition"
              @update:model-value="updateAdjustment('exposure', $event)"
            />
          </div>

          <!-- Contraste -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-white/70">Contraste</span>
              <span class="font-mono text-white/90">{{ model.contrast > 0 ? `+${model.contrast}` : model.contrast }}</span>
            </div>
            <Slider
              :model-value="model.contrast"
              :min="-100"
              :max="100"
              :step="1"
              size="sm"
              variant="gradient"
              aria-label="Contraste"
              @update:model-value="updateAdjustment('contrast', $event)"
            />
          </div>

          <!-- Saturation -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-white/70">Saturation</span>
              <span class="font-mono text-white/90">{{ model.saturation > 0 ? `+${model.saturation}` : model.saturation }}</span>
            </div>
            <Slider
              :model-value="model.saturation"
              :min="-100"
              :max="100"
              :step="1"
              size="sm"
              variant="gradient"
              aria-label="Saturation"
              @update:model-value="updateAdjustment('saturation', $event)"
            />
          </div>

          <!-- Température -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-white/70">Température</span>
              <span class="font-mono text-white/90">{{
                model.temperature > 0
                  ? `Chaud (+${model.temperature})`
                  : model.temperature < 0
                    ? `Froid (${model.temperature})`
                    : 'Neutre (0)'
              }}</span>
            </div>
            <Slider
              :model-value="model.temperature"
              :min="-100"
              :max="100"
              :step="1"
              size="sm"
              variant="gradient"
              aria-label="Température"
              @update:model-value="updateAdjustment('temperature', $event)"
            />
          </div>

          <!-- Teinte -->
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-white/70">Teinte</span>
              <span class="font-mono text-white/90">{{ model.tint > 0 ? `+${model.tint}` : model.tint }}°</span>
            </div>
            <Slider
              :model-value="model.tint"
              :min="-100"
              :max="100"
              :step="1"
              size="sm"
              variant="gradient"
              aria-label="Teinte"
              @update:model-value="updateAdjustment('tint', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Actions de pied de panneau -->
      <div class="flex items-center justify-between pt-1 border-t border-white/10">
        <Button
          size="xs"
          variant="ghost"
          class="text-white/60 hover:text-white gap-1.5"
          @click="resetToDefault"
        >
          <Icon name="restart_alt" size="xs" />
          <span>Réinitialiser</span>
        </Button>
        <span class="text-[10px] text-white/40">
          {{ model.enabled ? 'Actif sur la scène' : 'Désactivé' }}
        </span>
      </div>
    </div>
  </section>
</template>
