<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Accordion, type AccordionItemData } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import ColorGradingControls from './ColorGradingControls.vue'
import ShaderEffectsControls from './ShaderEffectsControls.vue'
import type {
  ColorGradingSettings,
  ShaderSettings,
  VisualEffectsControlsProps,
  VisualEffectsSection
} from './types'

const colorGrading = defineModel<ColorGradingSettings>('colorGrading', { required: true })
const shaderSettings = defineModel<ShaderSettings>('shaderSettings', { required: true })
const { class: className = undefined } = defineProps<VisualEffectsControlsProps>()
const emit = defineEmits<{
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
  (event: 'reset-all'): void
}>()

const sections = ref<VisualEffectsSection[]>([])
const hasColorGrading = computed(() => colorGrading.value.enabled)
const hasShaderEffects = computed(
  () =>
    shaderSettings.value.enabled &&
    shaderSettings.value.intensity > 0 &&
    (shaderSettings.value.grain > 0 ||
      shaderSettings.value.aberration > 0 ||
      shaderSettings.value.scanlines > 0 ||
      shaderSettings.value.vignette > 0 ||
      shaderSettings.value.bloom > 0)
)

const summary = computed(() => {
  if (hasColorGrading.value && hasShaderEffects.value) return 'Colorimétrie et effets stylisés'
  if (hasColorGrading.value) return 'Colorimétrie active'
  if (hasShaderEffects.value) return 'Effets stylisés actifs'
  return 'Aucun effet actif'
})

const accordionItems = computed<AccordionItemData[]>(() => [
  {
    value: 'color-grading',
    title: 'Colorimétrie',
    subtitle: hasColorGrading.value ? 'Active' : 'Inactive',
    icon: 'palette',
    badge: hasColorGrading.value ? 'Actif' : undefined
  },
  {
    value: 'shader-effects',
    title: 'Effets stylisés',
    subtitle: hasShaderEffects.value ? 'Actifs' : 'Inactifs',
    icon: 'auto_awesome',
    badge: hasShaderEffects.value ? 'Actif' : undefined
  }
])

watch(
  [hasColorGrading, hasShaderEffects],
  () => {
    if (sections.value.length > 0) return
    sections.value = [
      hasShaderEffects.value && !hasColorGrading.value ? 'shader-effects' : 'color-grading'
    ]
  },
  { immediate: true }
)
</script>

<template>
  <section
    :class="cn('text-text-primary', className)"
    role="region"
    aria-label="Réglages des effets visuels"
    data-testid="visual-effects-controls"
  >
    <div class="mb-2 text-[10px] text-text-muted">{{ summary }}</div>

    <Accordion
      v-model="sections"
      :items="accordionItems"
      type="multiple"
      variant="default"
      class="gap-0 divide-border-subtle"
    >
      <template #item-color-grading>
        <ColorGradingControls
          :model-value="colorGrading"
          @update:model-value="colorGrading = $event"
          @interaction-start="emit('interaction-start', $event)"
          @interaction-end="emit('interaction-end')"
        />
      </template>
      <template #item-shader-effects>
        <ShaderEffectsControls
          :model-value="shaderSettings"
          @update:model-value="shaderSettings = $event"
          @interaction-start="emit('interaction-start', $event)"
          @interaction-end="emit('interaction-end')"
        />
      </template>
    </Accordion>

    <div class="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
      <span class="text-[10px] text-text-muted">Réglages enregistrés dans le projet</span>
      <Button size="xs" variant="ghost" @click="emit('reset-all')">
        <Icon name="restart_alt" size="xs" />
        Tout réinitialiser
      </Button>
    </div>
  </section>
</template>
