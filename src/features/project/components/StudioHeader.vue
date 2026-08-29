<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useViewportSnapshotStore } from '@/features/editor/stores/useViewportSnapshotStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useWorkspaceBackupStore } from '../stores/useWorkspaceBackupStore'
import {
  createManualWorkspaceSnapshot,
  getManualSnapshotSummary,
  getManualWorkspaceSnapshot,
  restoreWorkspaceSnapshot,
  restoreManualWorkspaceSnapshot
} from '../services/workspace-snapshot.service'
import {
  parseWorkspaceBackupFile,
  serializeWorkspaceBackupFile,
  workspaceBackupFilename
} from '../services/workspace-backup-file.service'
import { resetApplicationToFactoryDefaults } from '../services/factory-reset.service'
import type { WorkspaceSnapshotSummary } from '@core/types/project.types'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import { toast } from '@/ui/shared/services/toast.service'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heading } from '@/components/ui/heading'
import { DropdownMenu, type DropdownMenuItemDef } from '@/components/ui/dropdown-menu'
import { AlertDialog } from '@/components/ui/alert-dialog'

const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'openExport'): void
  (event: 'openSavedSnapshots'): void
  (event: 'startTour'): void
}>()

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const snapshotStore = useViewportSnapshotStore()
const assetStore = useAssetStore()
const workspaceBackupStore = useWorkspaceBackupStore()
const rigCatalogStore = useRigCatalogStore()
const snapshotSummary = ref<WorkspaceSnapshotSummary | null>(null)
const backupFileInput = ref<HTMLInputElement | null>(null)
const isSnapshotBusy = ref(false)
const isResetConfirmOpen = ref(false)
const isResetting = ref(false)

const backupBadge = computed(
  () =>
    ({
      checking: { label: 'Vérification…', variant: 'neutral' as const, pulse: true },
      no_snapshot: { label: 'Aucune sauvegarde', variant: 'warning' as const, pulse: false },
      saved: { label: 'Sauvegardé', variant: 'success' as const, pulse: false },
      dirty: { label: 'Modifications à sauvegarder', variant: 'warning' as const, pulse: false },
      saving: { label: 'Sauvegarde…', variant: 'neutral' as const, pulse: true },
      error: { label: 'Erreur de sauvegarde', variant: 'danger' as const, pulse: false }
    })[workspaceBackupStore.status]
)

const applicationMenuItems = computed<DropdownMenuItemDef[]>(() => [
  {
    id: 'settings',
    label: 'Paramètres du plateau',
    icon: 'settings',
    onClick: () => emit('openSettings')
  },
  { id: 'separator-settings', type: 'separator' },
  { id: 'application-data', type: 'label', label: 'Données de l’application' },
  {
    id: 'save-application',
    label: 'Créer une sauvegarde locale',
    icon: 'save',
    disabled: isSnapshotBusy.value || isResetting.value,
    onClick: () => void saveSnapshot()
  },
  {
    id: 'restore-application',
    label: 'Restaurer la sauvegarde locale',
    icon: 'restore',
    disabled: isSnapshotBusy.value || isResetting.value || !snapshotSummary.value,
    onClick: () => void restoreSnapshot()
  },
  { id: 'separator-backup-file', type: 'separator' },
  {
    id: 'export-application-backup',
    label: 'Exporter la sauvegarde complète',
    icon: 'download',
    disabled: isSnapshotBusy.value || isResetting.value,
    onClick: () => void exportSnapshotFile()
  },
  {
    id: 'import-application-backup',
    label: 'Importer une sauvegarde complète',
    icon: 'upload',
    disabled: isSnapshotBusy.value || isResetting.value,
    onClick: () => backupFileInput.value?.click()
  },
  { id: 'separator-reset', type: 'separator' },
  {
    id: 'reset-application',
    label: 'Reset app',
    icon: 'delete_forever',
    destructive: true,
    disabled: isSnapshotBusy.value || isResetting.value,
    onClick: () => {
      isResetConfirmOpen.value = true
    }
  }
])

function formatSnapshotDate(timestamp: number) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(timestamp)
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

async function saveSnapshot() {
  if (isSnapshotBusy.value) return
  isSnapshotBusy.value = true
  workspaceBackupStore.beginSaving()
  try {
    editorStore.endGesture()
    await Promise.all([projectStore.saveProject(), editorStore.saveDocument()])
    snapshotSummary.value = await createManualWorkspaceSnapshot(
      projectStore.currentProject.id,
      JSON.stringify(rigCatalogStore.exportCatalog())
    )
    await workspaceBackupStore.finishSaving()
    toast.success(
      'Sauvegarde de l’application créée',
      `${snapshotSummary.value.assetCount} assets (${formatBytes(snapshotSummary.value.totalBlobSize)}) et ${snapshotSummary.value.viewportSnapshotCount} vue(s) enregistrée(s).`
    )
  } catch (error) {
    workspaceBackupStore.failSaving()
    toast.error(
      'Échec de la sauvegarde',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    isSnapshotBusy.value = false
  }
}

async function exportSnapshotFile() {
  if (isSnapshotBusy.value) return
  isSnapshotBusy.value = true
  workspaceBackupStore.beginSaving()
  try {
    editorStore.endGesture()
    await Promise.all([projectStore.saveProject(), editorStore.saveDocument()])
    snapshotSummary.value = await createManualWorkspaceSnapshot(
      projectStore.currentProject.id,
      JSON.stringify(rigCatalogStore.exportCatalog())
    )
    const snapshot = await getManualWorkspaceSnapshot()
    if (!snapshot) throw new Error('La sauvegarde locale vient de disparaître.')

    const contents = await serializeWorkspaceBackupFile(snapshot)
    const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = workspaceBackupFilename()
    link.click()
    URL.revokeObjectURL(url)

    await workspaceBackupStore.finishSaving()
    toast.success(
      'Sauvegarde complète exportée',
      `${snapshotSummary.value.assetCount} assets, leurs images, ${snapshotSummary.value.viewportSnapshotCount} vue(s) et le catalogue des rigs ont été inclus.`
    )
  } catch (error) {
    workspaceBackupStore.failSaving()
    toast.error(
      'Échec de l’export de sauvegarde',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    isSnapshotBusy.value = false
  }
}

async function importSnapshotFile(event: Event) {
  const input = event.currentTarget as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || isSnapshotBusy.value) return

  try {
    const snapshot = parseWorkspaceBackupFile(await file.text())
    const date = formatSnapshotDate(snapshot.createdAt)
    if (
      !confirm(
        `Importer la sauvegarde complète du ${date} ? Toutes les données de travail actuelles seront remplacées.`
      )
    ) {
      return
    }

    isSnapshotBusy.value = true
    workspaceBackupStore.beginSaving()
    editorStore.endGesture()
    await restoreWorkspaceSnapshot(snapshot)
    if (snapshot.rigCatalogJson) {
      rigCatalogStore.importCatalog(snapshot.rigCatalogJson, snapshot.assets)
    }
    await reloadRestoredWorkspace()
    snapshotSummary.value = await getManualSnapshotSummary()
    await workspaceBackupStore.finishSaving()
    toast.success(
      'Sauvegarde complète importée',
      `${snapshot.assets.length} assets, leurs images, ${snapshot.viewportSnapshots.length} vue(s) et le catalogue des rigs ont été restaurés.`
    )
  } catch (error) {
    if (isSnapshotBusy.value) workspaceBackupStore.failSaving()
    toast.error(
      'Échec de l’import de sauvegarde',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    isSnapshotBusy.value = false
  }
}

async function reloadRestoredWorkspace() {
  const workspace = await projectStore.loadInitialProject()
  await Promise.all([assetStore.loadAssets(), snapshotStore.loadSnapshots()])
  await editorStore.loadDocument(workspace.editorDocumentId, workspace.id)
  editorStore.clearStudioSelection()
}

async function restoreSnapshot() {
  if (isSnapshotBusy.value || !snapshotSummary.value) return
  const date = formatSnapshotDate(snapshotSummary.value.createdAt)
  if (
    !confirm(
      `Restaurer l’état complet de l’application du ${date} ? Les changements plus récents seront remplacés.`
    )
  ) {
    return
  }

  isSnapshotBusy.value = true
  workspaceBackupStore.beginSaving()
  try {
    editorStore.endGesture()
    const snapshot = await restoreManualWorkspaceSnapshot()
    if (snapshot.rigCatalogJson) {
      rigCatalogStore.importCatalog(snapshot.rigCatalogJson, snapshot.assets)
    }
    await reloadRestoredWorkspace()
    await workspaceBackupStore.finishSaving()
    toast.success(
      'Application restaurée',
      `État complet du ${formatSnapshotDate(snapshot.createdAt)} restauré.`
    )
  } catch (error) {
    workspaceBackupStore.failSaving()
    toast.error(
      'Échec de la restauration',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    isSnapshotBusy.value = false
  }
}

async function resetApplication() {
  if (isResetting.value) return
  isResetting.value = true
  workspaceBackupStore.dispose()
  try {
    await resetApplicationToFactoryDefaults()
    window.location.reload()
  } catch (error) {
    isResetting.value = false
    isResetConfirmOpen.value = false
    await workspaceBackupStore.initialize()
    toast.error(
      'Échec du reset de l’application',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  }
}

onMounted(async () => {
  try {
    snapshotSummary.value = await getManualSnapshotSummary()
  } catch {
    snapshotSummary.value = null
  }
})
</script>

<template>
  <header
    class="h-12 border-b border-border-subtle px-4 flex items-center justify-between bg-bg-surface/80 backdrop-blur-xl z-20 select-none"
  >
    <!-- eslint-disable-next-line vue/no-restricted-html-elements -- Sélecteur de fichier natif caché -->
    <input
      ref="backupFileInput"
      class="sr-only"
      type="file"
      accept="application/json,.json"
      aria-label="Importer une sauvegarde complète"
      @change="importSnapshotFile"
    />
    <div class="flex items-center gap-3">
      <Heading
        as="h1"
        variant="section"
        class="text-md font-black font-display tracking-tight leading-none"
      >
        <span class="text-yellow-500">Incroyaux</span>
        <span class="text-purple-600"> News</span> Studio
      </Heading>
      <Separator orientation="vertical" variant="subtle" class="h-5 mx-1" />
      <Badge
        :variant="backupBadge.variant"
        size="sm"
        class="text-[10px]"
        :class="{ 'animate-pulse': backupBadge.pulse }"
      >
        {{ backupBadge.label }}
      </Badge>
    </div>

    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        title="Enregistrer ou charger une composition du viewport"
        @click="emit('openSavedSnapshots')"
      >
        <Icon name="collections_bookmark" size="xs" class="text-primary" />
        <span>Vues sauvegardées</span>
      </Button>

      <IconButton
        icon="help"
        variant="ghost"
        size="sm"
        aria-label="Démarrer la visite guidée"
        title="Visite guidée"
        @click="emit('startTour')"
      />

      <div data-tour="backup">
        <DropdownMenu
          :items="applicationMenuItems"
          align="end"
          width="md"
          surface="glass"
          :disabled="isResetting"
        >
          <template #trigger>
            <IconButton
              icon="settings"
              variant="ghost"
              size="sm"
              aria-label="Menu des paramètres de l’application"
              title="Paramètres et données de l’application"
            />
          </template>
        </DropdownMenu>
      </div>

      <Button
        data-tour="export"
        variant="primary"
        size="sm"
        class="gap-1.5 text-xs shadow-glass-sm"
        title="Exporter le document ou des images"
        @click="emit('openExport')"
      >
        <Icon name="file_download" size="xs" />
        <span>Exporter</span>
      </Button>
    </div>

    <AlertDialog
      v-model:open="isResetConfirmOpen"
      title="Réinitialiser complètement l’application ?"
      description="Tous les projets, assets importés, groupes, compositions et sauvegardes seront définitivement supprimés. L’application redémarrera ensuite dans son état de sortie d’usine."
      variant="danger"
      confirm-text="Reset app"
      cancel-text="Conserver mes données"
      require-confirmation-text="RESET"
      :confirm-loading="isResetting"
      @confirm="resetApplication"
    />
  </header>
</template>
