<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Select, type SelectOption } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { FormGroup } from '@/components/ui/form-group'
import { Text } from '@/components/ui/text'
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
    :z-index="1700"
  >
    <div class="space-y-4 p-1">
      <!-- Choix du rig source -->
      <div class="space-y-2 rounded-lg border border-border-subtle bg-bg-elevated p-3">
        <FormGroup label="Rig source à dupliquer" class="mb-0">
          <Select
            v-model="selectedSourceId"
            :options="selectOptions"
            size="sm"
            class="mt-1"
            :content-z-index="1800"
            aria-label="Rig source"
          />
        </FormGroup>
        <Text as="p" variant="caption" color="muted" class="text-[11px]">
          Les réglages sélectionnés seront appliqués à :
          <strong class="text-text-primary">{{ currentRigName }}</strong
          >.
        </Text>
      </div>

      <!-- Éléments à copier -->
      <div class="space-y-2.5 rounded-lg border border-border-subtle bg-bg-elevated p-3">
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
      <div
        class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning-foreground space-y-2"
      >
        <div class="flex items-start gap-2">
          <Icon name="warning" size="sm" class="text-warning shrink-0 mt-0.5" />
          <div class="text-xs leading-relaxed">
            <Text as="p" variant="caption" color="primary" weight="semibold"
              >Action destructive</Text
            >
            <Text as="p" variant="caption" color="muted" class="mt-0.5">
              Cette action écrasera les réglages correspondants du rig actuel. Le sprite corps de
              destination sera préservé.
            </Text>
          </div>
        </div>
        <Checkbox
          v-model="confirmed"
          label="Je confirme vouloir appliquer ces modifications"
          size="sm"
          class="pt-1"
        />
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
