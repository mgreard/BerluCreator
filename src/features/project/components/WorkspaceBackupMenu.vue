<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  type DropdownMenuItemDef,
  type DropdownMenuSide
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import { useWorkspaceBackupActions } from '../composables/useWorkspaceBackupActions'

const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'openChange', open: boolean): void
}>()

const { placement = 'sidebar' } = defineProps<{
  placement?: 'sidebar' | 'header'
}>()

const isOpen = ref(false)
watch(isOpen, (open) => emit('openChange', open))
const triggerClass = computed(() =>
  [
    placement === 'header'
      ? 'h-7 gap-1.5 px-2 text-[11px] font-semibold'
      : 'w-full justify-start gap-2 text-xs font-semibold',
    isOpen.value ? 'bg-bg-surface-hover text-text-primary' : ''
  ]
    .filter(Boolean)
    .join(' ')
)
const fileInputRef = useTemplateRef<HTMLInputElement>('backupFileInput')
const {
  status,
  snapshotSummary,
  isBusy,
  isResetConfirmOpen,
  isResetting,
  saveSnapshot,
  exportSnapshotFile,
  importSnapshotFile,
  restoreSnapshot,
  resetApplication
} = useWorkspaceBackupActions()

const badgeLabel = computed(
  () =>
    ({
      checking: 'Vérification…',
      no_snapshot: 'Aucune sauvegarde',
      saved: 'Sauvegardé',
      dirty: 'Modifications à sauvegarder',
      saving: 'Sauvegarde…',
      error: 'Erreur de sauvegarde'
    })[status.value]
)

const menuSide = computed<DropdownMenuSide>(() => (placement === 'header' ? 'bottom' : 'right'))

const items = computed<DropdownMenuItemDef[]>(() => [
  {
    id: 'settings',
    label: 'Paramètres du plateau',
    icon: 'settings',
    onClick: () => emit('openSettings')
  },
  { id: 'separator-settings', type: 'separator' },
  { id: 'application-data', type: 'label', label: 'Données de l’application' },
  {
    id: 'save',
    label: 'Créer une sauvegarde locale',
    icon: 'save',
    disabled: isBusy.value || isResetting.value,
    onClick: () => void saveSnapshot()
  },
  {
    id: 'restore',
    label: 'Restaurer la sauvegarde locale',
    icon: 'restore',
    disabled: isBusy.value || isResetting.value || !snapshotSummary.value,
    onClick: () => void restoreSnapshot()
  },
  { id: 'separator-file', type: 'separator' },
  {
    id: 'export',
    label: 'Exporter la sauvegarde complète',
    icon: 'download',
    disabled: isBusy.value || isResetting.value,
    onClick: () => void exportSnapshotFile()
  },
  {
    id: 'import',
    label: 'Importer une sauvegarde complète',
    icon: 'upload',
    disabled: isBusy.value || isResetting.value,
    onClick: () => fileInputRef.value?.click()
  },
  { id: 'separator-reset', type: 'separator' },
  {
    id: 'reset',
    label: 'Réinitialiser l’application',
    icon: 'delete_forever',
    destructive: true,
    disabled: isBusy.value || isResetting.value,
    onClick: () => {
      isResetConfirmOpen.value = true
    }
  }
])

function handleFile(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void importSnapshotFile(file)
}
</script>

<template>
  <DropdownMenu
    v-model:open="isOpen"
    :items="items"
    :side="menuSide"
    align="start"
    :side-offset="placement === 'header' ? 8 : 10"
    width="w-72 max-w-[calc(100vw-2rem)]"
  >
    <template #trigger>
      <Button
        data-tour="backup-menu-btn"
        variant="ghost"
        :size="placement === 'header' ? 'xs' : 'sm'"
        :class="triggerClass"
        :title="badgeLabel"
      >
        <Icon name="apps" size="xs" class="text-primary" />
        <span>Projet</span>
        <span
          class="ml-auto size-1.5 rounded-full"
          :class="status === 'dirty' ? 'bg-warning' : 'bg-success'"
        />
        <Icon
          :name="placement === 'header' ? 'expand_more' : 'chevron_right'"
          size="xs"
          class="text-text-muted"
        />
      </Button>
    </template>
  </DropdownMenu>

  <!-- eslint-disable-next-line vue/no-restricted-html-elements -- sélecteur de fichier natif caché -->
  <input
    ref="backupFileInput"
    type="file"
    accept="application/json"
    class="hidden"
    @change="handleFile"
  />

  <AlertDialog
    v-model:open="isResetConfirmOpen"
    title="Réinitialiser l’application ?"
    description="Toutes les données de travail seront remplacées par l’espace d’origine. Cette action est irréversible."
    confirm-label="Réinitialiser complètement"
    cancel-label="Annuler"
    variant="danger"
    @confirm="resetApplication"
  />
</template>
