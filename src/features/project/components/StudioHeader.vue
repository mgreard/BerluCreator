<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useSavedKeyframeStore } from '@/features/timeline/stores/useSavedKeyframeStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useWorkspaceBackupStore } from '../stores/useWorkspaceBackupStore'
import {
  createManualWorkspaceSnapshot,
  getManualSnapshotSummary,
  restoreManualWorkspaceSnapshot
} from '../services/workspace-snapshot.service'
import type { WorkspaceSnapshotSummary } from '@core/types/project.types'
import { toast } from '@/ui/shared/services/toast.service'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heading } from '@/components/ui/heading'

const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'openExport'): void
  (event: 'openSavedKeyframes'): void
  (event: 'startTour'): void
}>()

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const savedKeyframeStore = useSavedKeyframeStore()
const assetStore = useAssetStore()
const workspaceBackupStore = useWorkspaceBackupStore()
const snapshotSummary = ref<WorkspaceSnapshotSummary | null>(null)
const isSnapshotBusy = ref(false)

const backupBadge = computed(() => ({
  checking: { label: 'Vérification…', variant: 'neutral' as const, pulse: true },
  no_snapshot: { label: 'Aucune sauvegarde', variant: 'warning' as const, pulse: false },
  saved: { label: 'Sauvegardé', variant: 'success' as const, pulse: false },
  dirty: { label: 'Modifications à sauvegarder', variant: 'warning' as const, pulse: false },
  saving: { label: 'Sauvegarde…', variant: 'neutral' as const, pulse: true },
  error: { label: 'Erreur de sauvegarde', variant: 'danger' as const, pulse: false }
})[workspaceBackupStore.status])

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
    timelineStore.pause()
    timelineStore.commitTransformSession(false)
    await Promise.all([projectStore.saveProject(), timelineStore.saveSequence()])
    snapshotSummary.value = await createManualWorkspaceSnapshot(projectStore.currentProject.id)
    await workspaceBackupStore.finishSaving()
    toast.success(
      'Sauvegarde de l’application créée',
      `${snapshotSummary.value.assetCount} assets (${formatBytes(snapshotSummary.value.totalBlobSize)}) et ${snapshotSummary.value.savedKeyframeCount} keyframe(s) enregistrée(s).`
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

async function restoreSnapshot() {
  if (isSnapshotBusy.value || !snapshotSummary.value) return
  const date = formatSnapshotDate(snapshotSummary.value.createdAt)
  if (!confirm(`Restaurer l’état complet de l’application du ${date} ? Les changements plus récents seront remplacés.`)) {
    return
  }

  isSnapshotBusy.value = true
  workspaceBackupStore.beginSaving()
  try {
    timelineStore.pause()
    timelineStore.commitTransformSession(false)
    const snapshot = await restoreManualWorkspaceSnapshot()
    const workspace = await projectStore.loadInitialProject()
    await Promise.all([assetStore.loadAssets(), savedKeyframeStore.loadPresets()])
    await timelineStore.loadSequence(workspace.activeSequenceId, workspace.id)
    timelineStore.clearStudioSelection(false)
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

onMounted(async () => {
  try {
    snapshotSummary.value = await getManualSnapshotSummary()
  } catch {
    snapshotSummary.value = null
  }
})
</script>

<template>
  <header class="h-12 border-b border-border-subtle px-4 flex items-center justify-between bg-bg-surface/80 backdrop-blur-xl z-20 select-none">
    <div class="flex items-center gap-3">
      <Heading as="h1" variant="section" class="text-md font-black font-display tracking-tight leading-none">
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
      <ButtonGroup data-tour="backup" aria-label="Sauvegarde complète de l’application">
        <Button
          variant="ghost"
          size="sm"
          class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
          :disabled="isSnapshotBusy"
          title="Créer ou remplacer la sauvegarde complète de l’application"
          @click="saveSnapshot"
        >
          <Icon name="save" size="xs" />
          <span>Sauvegarder l’application</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
          :disabled="isSnapshotBusy || !snapshotSummary"
          :title="snapshotSummary ? `Restaurer l’application du ${formatSnapshotDate(snapshotSummary.createdAt)}` : 'Aucune sauvegarde complète disponible'"
          @click="restoreSnapshot"
        >
          <Icon name="restore" size="xs" />
          <span>Restaurer l’application</span>
        </Button>
      </ButtonGroup>

      <Separator orientation="vertical" variant="subtle" class="h-5 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        title="Enregistrer ou charger une pose de keyframe"
        @click="emit('openSavedKeyframes')"
      >
        <Icon name="collections_bookmark" size="xs" class="text-primary" />
        <span>Keyframes</span>
      </Button>

      <IconButton
        icon="help"
        variant="ghost"
        size="sm"
        aria-label="Démarrer la visite guidée"
        title="Visite guidée"
        @click="emit('startTour')"
      />

      <IconButton
        icon="settings"
        variant="ghost"
        size="sm"
        aria-label="Paramètres du plateau"
        title="Paramètres du plateau"
        @click="emit('openSettings')"
      />

      <Button
        data-tour="export"
        variant="primary"
        size="sm"
        class="gap-1.5 text-xs shadow-glass-sm"
        title="Exporter des fichiers ou des images"
        @click="emit('openExport')"
      >
        <Icon name="file_download" size="xs" />
        <span>Exporter</span>
      </Button>
    </div>
  </header>
</template>
