<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { Accordion, type AccordionItemData } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { FloatingGlassPanel } from '@/components/ui/floating-glass-panel'
import { Icon } from '@/components/ui/icon'
import { IconButton } from '@/components/ui/icon-button'
import { Heading } from '@/components/ui/heading'
import { cn } from '@/shared/utils/cn'
import ColorGradingControls from './ColorGradingControls.vue'
import ShaderEffectsControls from './ShaderEffectsControls.vue'
import type {
  ColorGradingSettings,
  ShaderSettings,
  VisualEffectsOverlayProps,
  VisualEffectsSection
} from './types'

const colorGrading = defineModel<ColorGradingSettings>('colorGrading', { required: true })
const shaderSettings = defineModel<ShaderSettings>('shaderSettings', { required: true })
const open = defineModel<boolean>('open', { default: true })
const { variant = 'floating', class: className = undefined } = defineProps<VisualEffectsOverlayProps>()
const emit = defineEmits<{
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
  (event: 'reset-all'): void
}>()

const titleId = useId()
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
  open,
  (isOpen, wasOpen) => {
    if (!isOpen && wasOpen) emit('interaction-end')
    if (!isOpen || sections.value.length > 0) return
    sections.value = [
      hasShaderEffects.value && !hasColorGrading.value ? 'shader-effects' : 'color-grading'
    ]
  },
  { immediate: true }
)
</script>

<template>
  <!-- Mode Attaché directement sous la barre d'outils (pas de second drag handle) -->
  <section
    v-if="variant === 'attached' && open"
    :class="cn('viewport-glass w-96 flex flex-col rounded-2xl border border-white/15 shadow-glass-xl overflow-hidden pointer-events-auto text-white/90', className)"
    role="region"
    :aria-labelledby="titleId"
    data-testid="visual-effects-overlay"
    @pointerdown.stop
    @dblclick.stop
  >
    <header class="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/15 px-3 py-2">
      <div class="flex items-center gap-2 min-w-0">
        <Icon name="auto_fix_high" size="sm" class="shrink-0 text-primary" />
        <div class="min-w-0">
          <Heading :id="titleId" as="h3" variant="sm" class="text-xs font-semibold text-white">Effets visuels</Heading>
          <p class="truncate text-[10px] text-white/55">{{ summary }}</p>
        </div>
      </div>
      <IconButton
        icon="close"
        size="xs"
        variant="ghost"
        class="viewport-action shrink-0 text-white/60 hover:text-white"
        aria-label="Fermer le panneau Effets visuels"
        @click="open = false"
      />
    </header>

    <div class="p-3">
      <Accordion
        v-model="sections"
        :items="accordionItems"
        type="multiple"
        variant="default"
        class="gap-0 divide-white/10"
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

      <div class="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <span class="text-[10px] text-white/45">Réglages enregistrés dans le projet</span>
        <Button size="xs" variant="ghost" class="text-white/65" @click="emit('reset-all')">
          <Icon name="restart_alt" size="xs" />
          Tout réinitialiser
        </Button>
      </div>
    </div>
  </section>

  <!-- Mode Flottant indépendant (standalone) -->
  <FloatingGlassPanel
    v-else-if="open"
    v-model:open="open"
    panel-id="visual-effects"
    title="Effets visuels"
    :subtitle="summary"
    default-placement="top-right"
    :class="['w-96', className]"
    data-testid="visual-effects-overlay"
  >
    <template #icon>
      <Icon name="auto_fix_high" size="sm" class="shrink-0 text-primary" />
    </template>

    <div class="p-3">
      <Accordion
        v-model="sections"
        :items="accordionItems"
        type="multiple"
        variant="default"
        class="gap-0 divide-white/10"
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

      <div class="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
        <span class="text-[10px] text-white/45">Réglages enregistrés dans le projet</span>
        <Button size="xs" variant="ghost" class="text-white/65" @click="emit('reset-all')">
          <Icon name="restart_alt" size="xs" />
          Tout réinitialiser
        </Button>
      </div>
    </div>
  </FloatingGlassPanel>
</template>
