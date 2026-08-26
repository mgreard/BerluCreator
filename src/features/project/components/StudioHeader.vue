<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import {
  createManualWorkspaceSnapshot,
  getManualSnapshotSummary,
  restoreManualWorkspaceSnapshot
} from '../services/workspace-snapshot.service'
import type { WorkspaceSnapshotSummary } from '@core/types/project.types'
import { toast } from '@/ui/shared/services/toast.service'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Heading } from '@/components/ui/heading'

const emit = defineEmits<{
  (e: 'openSettings'): void
  (e: 'openExport'): void
  (e: 'openAiDirector'): void
}>()

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()
const snapshotSummary = ref<WorkspaceSnapshotSummary | null>(null)
const isSnapshotBusy = ref(false)

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
  try {
    timelineStore.pause()
    timelineStore.commitTransformSession(false)
    await Promise.all([projectStore.saveProject(), timelineStore.saveSequence()])
    snapshotSummary.value = await createManualWorkspaceSnapshot(projectStore.currentProject.id)
    toast.success(
      'Sauvegarde manuelle créée',
      `${snapshotSummary.value.assetCount} assets inclus (${formatBytes(snapshotSummary.value.totalBlobSize)}).`
    )
  } catch (error) {
    toast.error('Échec de la sauvegarde', error instanceof Error ? error.message : 'Erreur inconnue.')
  } finally {
    isSnapshotBusy.value = false
  }
}

async function restoreSnapshot() {
  if (isSnapshotBusy.value || !snapshotSummary.value) return
  const date = formatSnapshotDate(snapshotSummary.value.createdAt)
  if (!confirm(`Restaurer la sauvegarde du ${date} ? Les changements plus récents seront remplacés.`)) {
    return
  }

  isSnapshotBusy.value = true
  try {
    timelineStore.pause()
    timelineStore.commitTransformSession(false)
    const snapshot = await restoreManualWorkspaceSnapshot()
    const project = await projectStore.loadProject(snapshot.activeProjectId)
    await assetStore.loadAssets()
    await timelineStore.loadSequence(project.activeSequenceId, project.id)
    timelineStore.clearStudioSelection(false)
    toast.success('Sauvegarde restaurée', `État du ${formatSnapshotDate(snapshot.createdAt)} restauré.`)
  } catch (error) {
    toast.error('Échec de la restauration', error instanceof Error ? error.message : 'Erreur inconnue.')
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
    <!-- Logo & Titre de Projet -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-glow-sm">
          <Icon name="movie" size="sm" />
        </div>
        <div>
          <Heading as="h1" variant="sm" class="text-sm font-black font-display tracking-tight bg-gradient-to-r from-text-primary via-text-primary/90 to-text-muted bg-clip-text text-transparent leading-none">
            BerluCreator
          </Heading>
          <span class="text-[10px] text-text-muted font-mono block mt-0.5">
            Studio 2D Stop-Motion
          </span>
        </div>
      </div>

      <Separator orientation="vertical" variant="subtle" class="h-5 mx-1" />

      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-text-secondary truncate max-w-xs">
          {{ projectStore.currentProject.name }}
        </span>
        <Badge v-if="projectStore.isSaving" variant="neutral" size="sm" class="text-[10px] animate-pulse">
          Sauvegarde...
        </Badge>
        <Badge v-else variant="success" size="sm" class="text-[10px]">
          Local DB
        </Badge>
      </div>
    </div>

    <!-- Actions du Studio -->
    <div class="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        :disabled="isSnapshotBusy"
        title="Créer ou remplacer la sauvegarde manuelle complète"
        @click="saveSnapshot"
      >
        <Icon name="save" size="xs" />
        <span>Sauvegarder</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        :disabled="isSnapshotBusy || !snapshotSummary"
        :title="snapshotSummary ? `Restaurer la sauvegarde du ${formatSnapshotDate(snapshotSummary.createdAt)}` : 'Aucune sauvegarde manuelle disponible'"
        @click="restoreSnapshot"
      >
        <Icon name="restore" size="xs" />
        <span>Restaurer</span>
      </Button>

      <Separator orientation="vertical" variant="subtle" class="h-5 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        @click="emit('openAiDirector')"
      >
        <Icon name="auto_awesome" size="xs" class="text-amber-400" />
        <span>Scénariste IA</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        class="gap-1.5 text-xs text-text-secondary hover:text-text-primary"
        title="Paramètres de scène et de plateau"
        @click="emit('openSettings')"
      >
        <Icon name="settings" size="xs" />
        <span>Paramètres</span>
      </Button>

      <Button
        variant="primary"
        size="sm"
        class="gap-1.5 text-xs shadow-glass-sm"
        @click="emit('openExport')"
      >
        <Icon name="file_download" size="xs" />
        <span>Exporter</span>
      </Button>
    </div>
  </header>
</template>
