<script setup lang="ts">
import { computed, useId } from 'vue'
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { FormGroup } from '@/components/ui/form-group'
import { Select, type SelectOption } from '@/components/ui/select'
import type { RigCalibrationPanelRig } from './types'

const props = defineProps<{
  rigs: RigCalibrationPanelRig[]
  selectedRigId?: string
  bodyOrigin: { x: number; y: number }
  isEditingOrigin: boolean
}>()

const emit = defineEmits<{
  (event: 'selectRig', rigId: string): void
  (event: 'setDefaultRig'): void
  (event: 'editOrigin'): void
  (event: 'resetOrigin'): void
}>()

const open = defineModel<boolean>('open', { default: false })
const baseId = useId()
const rigOptions = computed<SelectOption[]>(() =>
  props.rigs.map((rig) => ({
    value: rig.id,
    label: rig.isDefault ? `${rig.label} · base` : rig.label
  }))
)
const selectedRig = computed(() => props.rigs.find((rig) => rig.id === props.selectedRigId))

function selectRig(value: unknown): void {
  if (typeof value === 'string') emit('selectRig', value)
}
</script>

<template>
  <CollapsibleRoot
    v-model:open="open"
    as="section"
    class="rounded-xl border border-white/10 bg-black/10 transition-colors duration-300 ease-out data-[state=open]:border-white/20"
    :aria-labelledby="`${baseId}-title`"
  >
    <CollapsibleTrigger
      class="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left outline-none transition-colors duration-300 ease-out hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span :id="`${baseId}-title`" class="text-[10px] font-bold uppercase tracking-wider text-text-muted">
        1. Corps & Origine
      </span>
      <span class="flex items-center gap-1.5">
        <Badge v-if="selectedRig?.isDefault" variant="accent" size="sm">Rig de base</Badge>
        <Icon :name="open ? 'expand_less' : 'expand_more'" size="xs" aria-hidden="true" />
      </span>
    </CollapsibleTrigger>

    <CollapsibleContent class="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
      <div class="space-y-2.5 border-t border-white/10 px-3 py-3">
        <FormGroup label="Sprite Corps" :label-for="`${baseId}-rig`" class="mb-0">
          <Select
            :id="`${baseId}-rig`"
            :model-value="selectedRigId"
            :options="rigOptions"
            size="sm"
            class="mt-1"
            aria-label="Corps principal du rig"
            @update:model-value="selectRig"
          />
        </FormGroup>

        <div class="space-y-2 rounded-lg border border-white/10 bg-black/10 p-2.5 text-xs">
          <div class="flex items-center justify-between gap-2 text-text-muted">
            <span class="font-medium text-text-secondary">Point d’ancrage (Origine)</span>
            <span class="font-mono text-[11px] font-semibold text-text-primary">
              X: {{ bodyOrigin.x }}px, Y: {{ bodyOrigin.y }}px
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button size="xs" :variant="isEditingOrigin ? 'primary' : 'secondary'" class="flex-1" @click="emit('editOrigin')">
              <Icon name="pin_drop" size="xs" />
              <span>{{ isEditingOrigin ? 'Origine active' : 'Ajuster l’origine' }}</span>
            </Button>
            <Button size="xs" variant="ghost" title="Recentrer l’origine au milieu du corps" @click="emit('resetOrigin')">
              <Icon name="center_focus_strong" size="xs" />
              <span>Centrer</span>
            </Button>
          </div>
        </div>

        <Button v-if="selectedRig && !selectedRig.isDefault" size="xs" variant="secondary" class="w-full" @click="emit('setDefaultRig')">
          <Icon name="star" size="xs" />
          <span>Définir comme rig par défaut</span>
        </Button>
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
