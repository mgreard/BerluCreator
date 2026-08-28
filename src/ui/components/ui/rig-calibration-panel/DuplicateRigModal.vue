<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Select, type SelectOption } from '@/components/ui/select'

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
  (event: 'duplicate', sourceRigId: string): void
}>()

const open = defineModel<boolean>('open', { default: false })
const selectedSourceId = ref<string>('')
const confirmed = ref(false)

const selectOptions = computed<SelectOption[]>(() =>
  availableRigs.map((rig) => ({
    value: rig.id,
    label: `${rig.label} (${rig.bodyLabel})`
  }))
)

watch(open, (isOpen) => {
  if (isOpen) {
    selectedSourceId.value = availableRigs[0]?.id ?? ''
    confirmed.value = false
  }
})

function handleConfirm(): void {
  if (!selectedSourceId.value || !confirmed.value) return
  emit('duplicate', selectedSourceId.value)
  open.value = false
}
</script>

<template>
  <Modal
    v-model:open="open"
    title="Copier la configuration d’un autre rig"
    subtitle="Transfère les templates de catégories, compatibilités et surcharges vers ce rig."
    size="md"
    surface="glass"
    :z-index="1700"
  >
    <div class="space-y-4 p-1">
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
          Les réglages seront copiés vers : <strong class="text-text-primary">{{ currentRigName }}</strong>.
        </p>
      </div>

      <div class="rounded-lg border border-warning/30 bg-warning/10 p-3 text-warning-foreground space-y-2">
        <div class="flex items-start gap-2">
          <Icon name="warning" size="sm" class="text-warning shrink-0 mt-0.5" />
          <div class="text-xs leading-relaxed">
            <p class="font-semibold text-text-primary">Action destructive</p>
            <p class="text-text-muted mt-0.5">
              Cette action remplacera les compatibilités et placements actuels de ce rig. Le corps principal de destination sera conservé.
            </p>
          </div>
        </div>
        <label class="flex items-center gap-2 pt-1 text-xs cursor-pointer select-none">
          <input
            v-model="confirmed"
            type="checkbox"
            class="rounded border-border-subtle text-primary focus:ring-primary h-4 w-4"
          />
          <span class="text-text-primary font-medium">Je confirme vouloir écraser la configuration actuelle</span>
        </label>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2">
        <Button size="sm" variant="ghost" @click="open = false">Annuler</Button>
        <Button
          size="sm"
          variant="primary"
          :disabled="!selectedSourceId || !confirmed"
          @click="handleConfirm"
        >
          <Icon name="content_copy" size="xs" />
          <span>Copier et remplacer</span>
        </Button>
      </div>
    </div>
  </Modal>
</template>
