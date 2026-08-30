<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_SHADER_SETTINGS, SHADER_PRESET_CONFIGS } from '@core/constants/editor'
import type {
  ShaderAdjustments,
  ShaderPreset,
  ShaderSettings,
  VisualEffectPresetItem
} from './types'

const props = defineProps<{ modelValue: ShaderSettings }>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: ShaderSettings): void
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
}>()

const showAdvanced = ref(false)
const presets: VisualEffectPresetItem<Exclude<ShaderPreset, 'none' | 'custom'>>[] = [
  { id: 'film_grain', label: 'Grain film' },
  { id: 'vignette', label: 'Vignettage' },
  { id: 'chromatic', label: 'Aberration' },
  { id: 'crt_retro', label: 'Écran CRT' },
  { id: 'vhs', label: 'Cassette VHS' },
  { id: 'bloom', label: 'Diffusion lumineuse' }
]

const adjustments: Array<{
  key: Exclude<keyof ShaderAdjustments, 'intensity'>
  label: string
  min: number
  max: number
  step: number
}> = [
  { key: 'grain', label: 'Grain de film', min: 0, max: 10, step: 0.1 },
  { key: 'aberration', label: 'Aberration chromatique', min: 0, max: 1, step: 0.05 },
  { key: 'scanlines', label: 'Scanlines CRT', min: 0, max: 5, step: 0.1 },
  { key: 'scanlinesDensity', label: 'Densité CRT', min: 0.5, max: 4, step: 0.1 },
  { key: 'vignette', label: 'Vignettage', min: 0, max: 10, step: 0.1 },
  { key: 'bloom', label: 'Diffusion lumineuse', min: 0, max: 20, step: 0.1 }
]

function update(changes: Partial<ShaderSettings>): void {
  emit('update:modelValue', { ...props.modelValue, ...changes })
}

function selectPreset(preset: Exclude<ShaderPreset, 'none' | 'custom'>): void {
  update({ enabled: true, preset, ...SHADER_PRESET_CONFIGS[preset] })
}

function updateAdjustment(key: keyof ShaderAdjustments, value: number | number[]): void {
  update({ [key]: Array.isArray(value) ? (value[0] ?? 0) : value, preset: 'custom' })
}

function reset(): void {
  emit('update:modelValue', { ...DEFAULT_SHADER_SETTINGS })
}
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="shader-effects-controls">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-xs font-medium text-white/90">Effets stylisés</p>
        <p class="text-[10px] text-white/55">Traitement WebGL facultatif</p>
      </div>
      <Switch
        :model-value="modelValue.enabled"
        size="sm"
        aria-label="Activer les effets stylisés"
        @update:model-value="update({ enabled: $event })"
      />
    </div>

    <div class="grid grid-cols-3 gap-1.5" aria-label="Presets d'effets stylisés">
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        class="min-h-9 rounded-lg border px-1.5 py-1.5 text-[10px] leading-tight transition-colors"
        :class="modelValue.enabled && modelValue.preset === preset.id
          ? 'border-amber-400/70 bg-amber-400/20 text-white'
          : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10'"
        @click="selectPreset(preset.id)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="flex flex-col gap-1 rounded-lg border border-white/10 bg-black/15 p-3">
      <div class="flex justify-between text-[10px] text-white/65">
        <span>Intensité globale</span>
        <span class="font-mono text-white/90">{{ modelValue.intensity }}</span>
      </div>
      <Slider
        :model-value="modelValue.intensity"
        :min="0"
        :max="100"
        :step="1"
        size="sm"
        variant="gradient"
        aria-label="Intensité globale"
        @interaction-start="$emit('interaction-start', 'Régler l’intensité des effets stylisés')"
        @interaction-end="$emit('interaction-end')"
        @update:model-value="updateAdjustment('intensity', $event)"
      />
    </div>

    <button
      type="button"
      class="flex min-h-10 items-center justify-between rounded-lg border border-white/10 px-3 text-xs text-white/75 hover:bg-white/5"
      :aria-expanded="showAdvanced"
      @click="showAdvanced = !showAdvanced"
    >
      <span>Réglages avancés</span>
      <Icon :name="showAdvanced ? 'expand_less' : 'expand_more'" size="xs" />
    </button>

    <div v-if="showAdvanced" class="flex flex-col gap-3 rounded-lg bg-black/15 p-3">
      <div v-for="adjustment in adjustments" :key="adjustment.key" class="flex flex-col gap-1">
        <div class="flex justify-between gap-3 text-[10px] text-white/65">
          <span>{{ adjustment.label }}</span>
          <span class="font-mono text-white/90">{{ modelValue[adjustment.key] }}</span>
        </div>
        <Slider
          :model-value="modelValue[adjustment.key]"
          :min="adjustment.min"
          :max="adjustment.max"
          :step="adjustment.step"
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
