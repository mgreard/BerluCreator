<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Text } from '@/components/ui/text'
import {
  COLOR_GRADING_PRESET_CONFIGS,
  DEFAULT_COLOR_GRADING_SETTINGS
} from '@core/constants/editor'
import type {
  ColorGradingAdjustments,
  ColorGradingPreset,
  ColorGradingSettings,
  VisualEffectPresetItem
} from './types'

const props = defineProps<{ modelValue: ColorGradingSettings }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: ColorGradingSettings): void
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
}>()

const showAdvanced = ref(false)
const presets: VisualEffectPresetItem<ColorGradingPreset>[] = [
  { id: 'neutral', label: 'Neutre', icon: 'wb_sunny' },
  { id: 'warm', label: 'Chaud', icon: 'local_fire_department' },
  { id: 'golden_hour', label: 'Golden hour', icon: 'flare' },
  { id: 'studio', label: 'Studio', icon: 'videocam' },
  { id: 'night', label: 'Nuit', icon: 'dark_mode' },
  { id: 'cartoon_punch', label: 'Cartoon punch', icon: 'auto_awesome' }
]

const adjustments: Array<{
  key: keyof ColorGradingAdjustments
  label: string
  min: number
  max: number
}> = [
  { key: 'exposure', label: 'Exposition', min: -100, max: 100 },
  { key: 'contrast', label: 'Contraste', min: -100, max: 100 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
  { key: 'temperature', label: 'Température', min: -100, max: 100 },
  { key: 'tint', label: 'Teinte', min: -100, max: 100 }
]

function update(changes: Partial<ColorGradingSettings>): void {
  emit('update:modelValue', { ...props.modelValue, ...changes })
}

function selectPreset(preset: Exclude<ColorGradingPreset, 'custom'>): void {
  update({ enabled: true, preset, ...COLOR_GRADING_PRESET_CONFIGS[preset] })
}

function updateAdjustment(key: keyof ColorGradingAdjustments, value: number | number[]): void {
  update({ [key]: Array.isArray(value) ? (value[0] ?? 0) : value, preset: 'custom' })
}

function reset(): void {
  emit('update:modelValue', { ...DEFAULT_COLOR_GRADING_SETTINGS })
}
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="color-grading-controls">
    <div class="flex items-center justify-between gap-3">
      <div>
        <Text as="p" variant="caption" color="inherit" weight="medium" class="text-xs text-white/90">Colorimétrie</Text>
        <Text as="p" variant="caption" color="inherit" class="text-[10px] text-white/55">Ambiance globale de la scène</Text>
      </div>
      <Switch
        :model-value="modelValue.enabled"
        size="sm"
        aria-label="Activer la colorimétrie"
        @update:model-value="update({ enabled: $event })"
      />
    </div>

    <div class="grid grid-cols-3 gap-1.5" aria-label="Presets de colorimétrie">
      <Button
        v-for="preset in presets"
        :key="preset.id"
        variant="ghost"
        size="xs"
        class="min-h-9 rounded-lg border px-2 py-1.5 text-[10px] transition-colors"
        :class="modelValue.enabled && modelValue.preset === preset.id
          ? 'border-primary/70 bg-primary/20 text-white'
          : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10'"
        @click="selectPreset(preset.id as Exclude<ColorGradingPreset, 'custom'>)"
      >
        {{ preset.label }}
      </Button>
    </div>

    <Button
      variant="ghost"
      size="sm"
      class="flex min-h-10 items-center justify-between rounded-lg border border-white/10 px-3 text-xs text-white/75 hover:bg-white/5"
      :aria-expanded="showAdvanced"
      @click="showAdvanced = !showAdvanced"
    >
      <span>Ajustements avancés</span>
      <Icon :name="showAdvanced ? 'expand_less' : 'expand_more'" size="xs" />
    </Button>

    <div v-if="showAdvanced" class="flex flex-col gap-3 rounded-lg bg-black/15 p-3">
      <div v-for="adjustment in adjustments" :key="adjustment.key" class="flex flex-col gap-1">
        <div class="flex justify-between text-[10px] text-white/65">
          <span>{{ adjustment.label }}</span>
          <span class="font-mono text-white/90">{{ modelValue[adjustment.key] }}</span>
        </div>
        <Slider
          :model-value="modelValue[adjustment.key]"
          :min="adjustment.min"
          :max="adjustment.max"
          :step="1"
          size="sm"
          variant="gradient"
          :aria-label="adjustment.label"
          @interaction-start="$emit('interaction-start', `Régler ${adjustment.label.toLowerCase()}`)"
          @interaction-end="$emit('interaction-end')"
          @update:model-value="updateAdjustment(adjustment.key, $event)"
        />
      </div>
    </div>

    <Button size="xs" variant="ghost" class="self-start text-white/60" @click="reset">
      <Icon name="restart_alt" size="xs" />
      Réinitialiser la section
    </Button>
  </div>
</template>
