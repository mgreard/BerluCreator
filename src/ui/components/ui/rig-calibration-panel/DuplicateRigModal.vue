<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Select, type SelectOption } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import type { DuplicateRigOptions } from '@/features/studio/rig-calibration/rig-catalog.types'

export interface DuplicateRigOption {
  id: string
  label: string
  bodyLabel: string
}

interface Props {
  currentRigName: string
  availableRigs: DuplicateRigOption[]
}

const { currentRigName, availableRigs } = defineProps<Props>()
const emit = defineEmits<{
  (event: 'duplicate', payload: { sourceRigId: string; options: DuplicateRigOptions }): void
}>()

const open = defineModel<boolean>('open', { default: false })
const selectedSourceId = ref<string>('')
const confirmed = ref(false)

const copyOrigin = ref(true)
const copyCommonPosition = ref(true)
const copySpecificPositions = ref(true)
const copyCompatibilities = ref(true)
const copyDefaultHead = ref(true)

const selectOptions = computed<SelectOption[]>(() =>
  availableRigs.map((rig) => ({
    value: rig.id,
    label: `${rig.label} (${rig.bodyLabel})`
  }))
)

const hasAtLeastOneOptionSelected = computed(
  () =>
    copyOrigin.value ||
    copyCommonPosition.value ||
    copySpecificPositions.value ||
    copyCompatibilities.value ||
    copyDefaultHead.value
)

watch(open, (isOpen) => {
  if (isOpen) {
    selectedSourceId.value = availableRigs[0]?.id ?? ''
    confirmed.value = false
    copyOrigin.value = true
    copyCommonPosition.value = true
    copySpecificPositions.value = true
    copyCompatibilities.value = true
    copyDefaultHead.value = true
  }
})

function handleConfirm(): void {
  if (!selectedSourceId.value || !confirmed.value || !hasAtLeastOneOptionSelected.value) return
  emit('duplicate', {
    sourceRigId: selectedSourceId.value,
    options: {
      copyOrigin: copyOrigin.value,
      copyCommonPosition: copyCommonPosition.value,
      copySpecificPositions: copySpecificPositions.value,
      copyCompatibilities: copyCompatibilities.value,
      copyDefaultHead: copyDefaultHead.value
    }
  })
  open.value = false
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="Copier la configuration d’un autre rig"
    subtitle="Transfère sélectivement l’origine, les positions et les compatibilités vers ce rig."
    size="md"
    surface="glass"
    :z-index="1700"
  >
    <div class="space-y-4 p-1">
      <!-- Choix du rig source -->
      <div class="rounded-lg border border-border-subtle bg-bg-elevated/60 p-3 space-y-2">
        <label class="block text-xs font-semibold text-text-primary">
          Rig source à dupliquer
          <Select
            v-model="selectedSourceId"
            :options="selectOptions"
            size="sm"
            class="mt-1"
            :content-z-index="1800"
            aria-label="Rig source"
          />
        </label>
        <p class="text-[11px] text-text-muted">
          Les réglages sélectionnés seront appliqués à :
          <strong class="text-text-primary">{{ currentRigName }}</strong>.
        </p>
      </div>

      <!-- Éléments à copier -->
      <div class="rounded-lg border border-border-subtle bg-bg-elevated/40 p-3 space-y-2.5">
        <span class="block text-xs font-semibold text-text-primary">Éléments à transférer</span>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
          <Checkbox v-model="copyOrigin" label="Origine du corps" size="sm" />
          <Checkbox v-model="copyCommonPosition" label="Position commune des têtes" size="sm" />
          <Checkbox v-model="copySpecificPositions" label="Positions spécifiques" size="sm" />
          <Checkbox v-model="copyCompatibilities" label="Compatibilités de têtes" size="sm" />
          <Checkbox v-model="copyDefaultHead" label="Tête par défaut" size="sm" />
        </div>
      </div>

      <!-- Avertissement confirmation -->
      <div class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning-foreground space-y-2">
        <div class="flex items-start gap-2">
          <Icon name="warning" size="sm" class="text-warning shrink-0 mt-0.5" />
          <div class="text-xs leading-relaxed">
            <p class="font-semibold text-text-primary">Action destructive</p>
            <p class="text-text-muted mt-0.5">
              Cette action écrasera les réglages correspondants du rig actuel. Le sprite corps de destination sera préservé.
            </p>
          </div>
        </div>
        <label class="flex items-center gap-2 pt-1 text-xs cursor-pointer select-none">
          <input
            v-model="confirmed"
            type="checkbox"
            class="rounded border-border-subtle text-primary focus:ring-primary h-4 w-4"
          />
          <span class="text-text-primary font-medium">Je confirme vouloir appliquer ces modifications</span>
        </label>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <Button size="sm" variant="ghost" @click="open = false">Annuler</Button>
        <Button
          size="sm"
          variant="primary"
          :disabled="!selectedSourceId || !confirmed || !hasAtLeastOneOptionSelected"
          @click="handleConfirm"
        >
          <Icon name="content_copy" size="xs" />
          <span>Copier la sélection</span>
        </Button>
      </div>
    </div>
  </Modal>
</template>
