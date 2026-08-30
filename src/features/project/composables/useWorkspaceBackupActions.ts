import { computed, ref } from 'vue'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useViewportSnapshotStore } from '@/features/editor/stores/useViewportSnapshotStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useWorkspaceBackupStore } from '@/features/project/stores/useWorkspaceBackupStore'
import { useRigCatalogStore } from '@/features/studio/rig-calibration/rig-catalog.store'
import {
  createManualWorkspaceSnapshot,
  getManualSnapshotSummary,
  getManualWorkspaceSnapshot,
  restoreManualWorkspaceSnapshot,
  restoreWorkspaceSnapshot
} from '@/features/project/services/workspace-snapshot.service'
import {
  parseWorkspaceBackupFile,
  serializeWorkspaceBackupFile,
  workspaceBackupFilename
} from '@/features/project/services/workspace-backup-file.service'
import { resetApplicationToFactoryDefaults } from '@/features/project/services/factory-reset.service'
import type { WorkspaceSnapshotSummary } from '@core/types/project.types'
import { toast } from '@/ui/shared/services/toast.service'

export function useWorkspaceBackupActions() {
  const projectStore = useProjectStore()
  const editorStore = useEditorStore()
  const snapshotStore = useViewportSnapshotStore()
  const assetStore = useAssetStore()
  const backupStore = useWorkspaceBackupStore()
  const rigCatalogStore = useRigCatalogStore()

  const snapshotSummary = ref<WorkspaceSnapshotSummary | null>(null)
  const isBusy = ref(false)
  const isResetConfirmOpen = ref(false)
  const isResetting = ref(false)
  const status = computed(() => backupStore.status)

  function formatSnapshotDate(timestamp: number) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(timestamp)
  }

  async function persistWorkspace() {
    editorStore.endGesture()
    await Promise.all([projectStore.saveProject(), editorStore.saveDocument()])
  }

  async function reloadRestoredWorkspace() {
    const workspace = await projectStore.loadInitialProject()
    await Promise.all([assetStore.loadAssets(), snapshotStore.loadSnapshots()])
    await editorStore.loadDocument(workspace.editorDocumentId, workspace.id)
    editorStore.clearStudioSelection()
  }

  async function saveSnapshot() {
    if (isBusy.value) return
    isBusy.value = true
    backupStore.beginSaving()
    try {
      await persistWorkspace()
      snapshotSummary.value = await createManualWorkspaceSnapshot(
        projectStore.currentProject.id,
        JSON.stringify(rigCatalogStore.exportCatalog())
      )
      await backupStore.finishSaving()
      toast.success(
        'Sauvegarde locale créée',
        `${snapshotSummary.value.assetCount} assets et ${snapshotSummary.value.viewportSnapshotCount} vue(s) enregistrée(s).`
      )
    } catch (error) {
      backupStore.failSaving()
      toast.error('Échec de la sauvegarde', error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      isBusy.value = false
    }
  }

  async function exportSnapshotFile() {
    if (isBusy.value) return
    isBusy.value = true
    backupStore.beginSaving()
    try {
      await persistWorkspace()
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

      await backupStore.finishSaving()
      toast.success('Sauvegarde complète exportée', 'Assets, vues et catalogue des rigs inclus.')
    } catch (error) {
      backupStore.failSaving()
      toast.error('Échec de l’export', error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      isBusy.value = false
    }
  }

  async function importSnapshotFile(file: File) {
    if (isBusy.value) return
    try {
      const snapshot = parseWorkspaceBackupFile(await file.text())
      const date = formatSnapshotDate(snapshot.createdAt)
      if (!confirm(`Importer la sauvegarde complète du ${date} ? Toutes les données actuelles seront remplacées.`)) {
        return
      }

      isBusy.value = true
      backupStore.beginSaving()
      editorStore.endGesture()
      await restoreWorkspaceSnapshot(snapshot)
      if (snapshot.rigCatalogJson) rigCatalogStore.importCatalog(snapshot.rigCatalogJson, snapshot.assets)
      await reloadRestoredWorkspace()
      snapshotSummary.value = await getManualSnapshotSummary()
      await backupStore.finishSaving()
      toast.success('Sauvegarde complète importée', `${snapshot.assets.length} assets restaurés.`)
    } catch (error) {
      if (isBusy.value) backupStore.failSaving()
      toast.error('Échec de l’import', error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      isBusy.value = false
    }
  }

  async function restoreSnapshot() {
    if (isBusy.value || !snapshotSummary.value) return
    const date = formatSnapshotDate(snapshotSummary.value.createdAt)
    if (!confirm(`Restaurer l’état complet de l’application du ${date} ?`)) return

    isBusy.value = true
    backupStore.beginSaving()
    try {
      editorStore.endGesture()
      const snapshot = await restoreManualWorkspaceSnapshot()
      if (snapshot.rigCatalogJson) rigCatalogStore.importCatalog(snapshot.rigCatalogJson, snapshot.assets)
      await reloadRestoredWorkspace()
      await backupStore.finishSaving()
      toast.success('Application restaurée', `Sauvegarde du ${date} réactivée.`)
    } catch (error) {
      backupStore.failSaving()
      toast.error('Échec de la restauration', error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      isBusy.value = false
    }
  }

  async function resetApplication() {
    isResetting.value = true
    isResetConfirmOpen.value = false
    try {
      await resetApplicationToFactoryDefaults()
      snapshotSummary.value = null
      await reloadRestoredWorkspace()
      await backupStore.refresh()
      toast.success('Application réinitialisée', 'L’espace de travail d’origine a été restauré.')
    } catch (error) {
      toast.error('Échec de la réinitialisation', error instanceof Error ? error.message : 'Erreur inconnue.')
    } finally {
      isResetting.value = false
    }
  }

  return {
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
  }
}
