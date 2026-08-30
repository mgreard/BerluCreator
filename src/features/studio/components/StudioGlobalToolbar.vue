<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
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
  restoreWorkspaceSnapshot,
  restoreManualWorkspaceSnapshot
} from '@/features/project/services/workspace-snapshot.service'
import {
  parseWorkspaceBackupFile,
  serializeWorkspaceBackupFile,
  workspaceBackupFilename
} from '@/features/project/services/workspace-backup-file.service'
import { resetApplicationToFactoryDefaults } from '@/features/project/services/factory-reset.service'
import type { WorkspaceSnapshotSummary } from '@core/types/project.types'
import type { CameraFrame, ColorGradingSettings, DepthOfFieldSettings, ShaderSettings } from '@core/types/editor.types'
import { DEFAULT_COLOR_GRADING_SETTINGS, DEFAULT_SHADER_SETTINGS } from '@core/constants/editor'
import type { TourKey } from '@/features/project/services/tour-definitions'
import { toast } from '@/ui/shared/services/toast.service'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Popover } from '@/components/ui/popover'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { DropdownMenu, type DropdownMenuItemDef } from '@/components/ui/dropdown-menu'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { VisualEffectsOverlay } from '@/components/ui/visual-effects-overlay'

const colorGrading = defineModel<ColorGradingSettings>('colorGrading', {
  default: () => ({ ...DEFAULT_COLOR_GRADING_SETTINGS })
})

const shaderSettings = defineModel<ShaderSettings>('shaderSettings', {
  default: () => ({ ...DEFAULT_SHADER_SETTINGS })
})

const {
  stage = { width: 1792, height: 1024 },
  activeCamera = { enabled: false, x: 0, y: 0, width: 1792, height: 1024, aspectRatio: '16:9' },
  depthOfField = { enabled: false, focusY: 0.5, feather: 100, blurRadius: 8 },
  hasVisualEffects = false,
  isSavedSnapshotsOpen = false,
  isRigCalibrationOpen = false,
  canUndo = false,
  canRedo = false
} = defineProps<{
  stage?: { width: number; height: number }
  activeCamera?: CameraFrame
  depthOfField?: DepthOfFieldSettings
  hasVisualEffects?: boolean
  isSavedSnapshotsOpen?: boolean
  isRigCalibrationOpen?: boolean
  canUndo?: boolean
  canRedo?: boolean
}>()

const emit = defineEmits<{
  (event: 'openSettings'): void
  (event: 'openExport'): void
  (event: 'toggleSavedSnapshots'): void
  (event: 'toggleDepthOfField'): void
  (event: 'updateDofBlurRadius', value: number | number[]): void
  (event: 'updateDofFeather', value: number | number[]): void
  (event: 'beginDepthInteraction', label: string): void
  (event: 'finishDepthInteraction'): void
  (event: 'toggleCameraFrame'): void
  (event: 'toggleRigCalibration'): void
  (event: 'undo'): void
  (event: 'redo'): void
  (event: 'startTour', key?: TourKey): void
  (event: 'interaction-start', label: string): void
  (event: 'interaction-end'): void
  (event: 'reset-visual-effects'): void
}>()

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const snapshotStore = useViewportSnapshotStore()
const assetStore = useAssetStore()
const workspaceBackupStore = useWorkspaceBackupStore()
const rigCatalogStore = useRigCatalogStore()

// Gestionnaire d'exclusion mutuelle pour popovers & dropdowns
type ActiveToolbarMenu = 'none' | 'project' | 'effects' | 'dof' | 'help'
const activeMenu = ref<ActiveToolbarMenu>('none')

const isProjectMenuOpen = computed({
  get: () => activeMenu.value === 'project',
  set: (open) => {
    activeMenu.value = open ? 'project' : 'none'
  }
})

const isVisualEffectsOpen = computed({
  get: () => activeMenu.value === 'effects',
  set: (open) => {
    activeMenu.value = open ? 'effects' : 'none'
  }
})

const isDofSettingsOpen = computed({
  get: () => activeMenu.value === 'dof',
  set: (open) => {
    activeMenu.value = open ? 'dof' : 'none'
  }
})

const isTourMenuOpen = computed({
  get: () => activeMenu.value === 'help',
  set: (open) => {
    activeMenu.value = open ? 'help' : 'none'
  }
})

const snapshotSummary = ref<WorkspaceSnapshotSummary | null>(null)
const backupFileInputRef = useTemplateRef<HTMLInputElement>('backupFileInput')
const isSnapshotBusy = ref(false)
const isResetConfirmOpen = ref(false)
const isResetting = ref(false)

const backupBadge = computed(
  () =>
    ({
      checking: { label: 'Vérification…', variant: 'neutral' as const },
      no_snapshot: { label: 'Aucune sauvegarde', variant: 'warning' as const },
      saved: { label: 'Sauvegardé', variant: 'success' as const },
      dirty: { label: 'Modifications à sauvegarder', variant: 'warning' as const },
      saving: { label: 'Sauvegarde…', variant: 'neutral' as const },
      error: { label: 'Erreur de sauvegarde', variant: 'danger' as const }
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
    onClick: () => backupFileInputRef.value?.click()
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

const tourMenuItems = computed<DropdownMenuItemDef[]>(() => [
  {
    id: 'current-context-tour',
    label: 'Visite guidée du Studio',
    icon: 'help_center',
    onClick: () => emit('startTour', 'studio-overview')
  },
  { id: 'separator-tours', type: 'separator' },
  { id: 'tours-label', type: 'label', label: 'Toutes les visites' },
  {
    id: 'tour-studio',
    label: 'Studio & Viewport',
    icon: 'dashboard',
    onClick: () => emit('startTour', 'studio-overview')
  },
  {
    id: 'tour-rig',
    label: 'Calibrage de personnage',
    icon: 'accessibility_new',
    onClick: () => emit('startTour', 'rig-calibration')
  },
  {
    id: 'tour-snapshots',
    label: 'Vues sauvegardées',
    icon: 'collections_bookmark',
    onClick: () => emit('startTour', 'saved-snapshots')
  },
  {
    id: 'tour-export',
    label: 'Module d’exportation',
    icon: 'file_download',
    onClick: () => emit('startTour', 'export')
  }
])

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function formatSnapshotDate(timestamp: number) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(timestamp)
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
      'Sauvegarde locale créée',
      `${snapshotSummary.value.assetCount} assets (${formatBytes(snapshotSummary.value.totalBlobSize)}) et ${snapshotSummary.value.viewportSnapshotCount} vue(s) enregistrée(s).`
    )
  } catch (error) {
    workspaceBackupStore.failSaving()
    toast.error('Échec de la sauvegarde', error instanceof Error ? error.message : 'Erreur inconnue.')
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
      `${snapshotSummary.value.assetCount} assets, leurs images, ${snapshotSummary.value.viewportSnapshotCount} vue(s) et le catalogue des rigs inclus.`
    )
  } catch (error) {
    workspaceBackupStore.failSaving()
    toast.error('Échec de l’export', error instanceof Error ? error.message : 'Erreur inconnue.')
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
      `${snapshot.assets.length} assets et ${snapshot.viewportSnapshots.length} vue(s) restaurés.`
    )
  } catch (error) {
    if (isSnapshotBusy.value) workspaceBackupStore.failSaving()
    toast.error('Échec de l’import', error instanceof Error ? error.message : 'Erreur inconnue.')
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
    toast.success('Application restaurée', `Sauvegarde du ${date} réactivée.`)
  } catch (error) {
    workspaceBackupStore.failSaving()
    toast.error('Échec de la restauration', error instanceof Error ? error.message : 'Erreur inconnue.')
  } finally {
    isSnapshotBusy.value = false
  }
}

async function handleResetConfirm() {
  isResetting.value = true
  isResetConfirmOpen.value = false
  try {
    await resetApplicationToFactoryDefaults()
    snapshotSummary.value = null
    await reloadRestoredWorkspace()
    await workspaceBackupStore.refresh()
    toast.success('Application réinitialisée', 'L’espace de travail d’origine a été restauré.')
  } catch (error) {
    toast.error('Échec de la réinitialisation', error instanceof Error ? error.message : 'Erreur inconnue.')
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div
    class="viewport-glass absolute top-3 left-1/2 -translate-x-1/2 z-40 flex flex-nowrap items-center gap-1.5 rounded-2xl border border-white/15 px-2.5 py-1 text-white/90 shadow-glass-xl pointer-events-auto select-none max-w-[calc(100%-1.5rem)] whitespace-nowrap overflow-x-auto scrollbar-none"
    data-tour="viewport-top-actions"
    role="toolbar"
    aria-label="Actions globales du studio"
    @pointerdown.stop
    @dblclick.stop
  >
    <!-- Îlot 1 : Titre Studio & Menu Projet / Sauvegarde -->
    <div class="flex items-center gap-1.5 pr-2 border-r border-white/15 shrink-0">
      <span class="flex items-center gap-1.5 font-bold text-xs tracking-tight text-white select-none">
        <span class="size-2 rounded-full bg-primary animate-pulse"></span>
        <span class="hidden sm:inline">Incroyaux News</span>
      </span>

      <DropdownMenu
        v-model:open="isProjectMenuOpen"
        :items="applicationMenuItems"
        surface="glass"
        align="start"
        class="viewport-glass border-white/15 text-white/90 shadow-glass-xl"
      >
        <template #trigger>
          <Button
            data-tour="backup-menu-btn"
            variant="ghost"
            size="xs"
            class="h-7 gap-1 px-2 text-[11px] font-medium border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/90"
            :class="isProjectMenuOpen ? 'bg-white/15 border-white/30 text-white' : ''"
            :title="backupBadge.label"
          >
            <Icon name="save" size="xs" class="text-primary" />
            <span class="hidden md:inline">{{ backupBadge.label }}</span>
            <Icon name="arrow_drop_down" size="xs" class="text-white/50 -mr-1" />
          </Button>
        </template>
      </DropdownMenu>
    </div>

    <!-- Îlot 2 : Modules de Scène (Boutons avec labels clairs et popovers ancrés) -->
    <div class="flex items-center gap-1 pr-2 border-r border-white/15 shrink-0">
      <!-- Vues Sauvegardées -->
      <Button
        data-tour="saved-snapshots-btn"
        variant="ghost"
        size="xs"
        class="h-7 gap-1 px-2 text-[11px] font-medium transition-colors"
        :class="isSavedSnapshotsOpen ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
        title="Ouvrir le panneau des compositions sauvegardées"
        @click="emit('toggleSavedSnapshots')"
      >
        <Icon name="collections_bookmark" size="xs" class="text-primary" />
        <span>Vues</span>
      </Button>

      <!-- Effets Visuels (avec Popover ancré en dessous) -->
      <Popover
        v-model="isVisualEffectsOpen"
        side="bottom"
        align="center"
        surface="glass"
        width="lg"
        :side-offset="10"
      >
        <template #trigger>
          <Button
            data-tour="visual-effects"
            variant="ghost"
            size="xs"
            class="h-7 gap-1 px-2 text-[11px] font-medium transition-colors"
            :class="(hasVisualEffects || isVisualEffectsOpen) ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
            title="Ouvrir les effets visuels et colorimétrie"
          >
            <Icon name="auto_fix_high" size="xs" :class="hasVisualEffects ? 'text-amber-400' : 'text-primary'" />
            <span>Effets</span>
            <span v-if="hasVisualEffects" class="size-1.5 rounded-full bg-amber-400"></span>
          </Button>
        </template>

        <VisualEffectsOverlay
          v-model:color-grading="colorGrading"
          v-model:shader-settings="shaderSettings"
          v-model:open="isVisualEffectsOpen"
          variant="attached"
          class="border-0 shadow-none bg-transparent w-full"
          @interaction-start="(label) => emit('interaction-start', label)"
          @interaction-end="() => emit('interaction-end')"
          @reset-all="() => emit('reset-visual-effects')"
        />
      </Popover>

      <!-- Cadrage Caméra -->
      <Button
        variant="ghost"
        size="xs"
        class="h-7 gap-1 px-2 text-[11px] font-medium transition-colors"
        :class="activeCamera.enabled ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
        title="Activer/Désactiver le cadrage caméra"
        @click="emit('toggleCameraFrame')"
      >
        <Icon name="crop_free" size="xs" class="text-primary" />
        <span>Cadrage</span>
      </Button>

      <!-- Profondeur de champ (Flou unifié avec Popover ancré en dessous) -->
      <Popover
        v-model="isDofSettingsOpen"
        side="bottom"
        align="center"
        surface="glass"
        width="md"
        :side-offset="10"
      >
        <template #trigger>
          <Button
            variant="ghost"
            size="xs"
            class="h-7 gap-1 px-2 text-[11px] font-medium transition-colors"
            :class="(depthOfField.enabled || isDofSettingsOpen) ? 'bg-primary/30 text-white border border-primary/60' : 'text-white/80 hover:text-white hover:bg-white/10'"
            title="Ouvrir les réglages du flou de profondeur"
          >
            <Icon name="blur_on" size="xs" :class="depthOfField.enabled ? 'text-cyan-400' : 'text-primary'" />
            <span>Flou</span>
            <span v-if="depthOfField.enabled" class="size-1.5 rounded-full bg-cyan-400"></span>
          </Button>
        </template>

        <div class="p-3.5 text-white/90 space-y-3.5" data-depth-controls>
          <!-- En-tête avec titre & Switch On/Off -->
          <div class="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div class="flex items-center gap-2">
              <div class="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Icon name="blur_on" size="xs" />
              </div>
              <div>
                <Heading as="h4" variant="sm" class="text-xs font-semibold text-white">Profondeur de champ</Heading>
                <Text variant="caption" class="text-[10px] text-white/55">Flou optique avant / arrière-plan</Text>
              </div>
            </div>
            <Switch
              :model-value="depthOfField.enabled"
              size="sm"
              @update:model-value="() => emit('toggleDepthOfField')"
            />
          </div>

          <!-- Contrôles actifs de Flou -->
          <template v-if="depthOfField.enabled">
            <div
              data-blur-control
              @pointerdown.capture="emit('beginDepthInteraction', 'Régler le rayon du flou')"
              @pointerup.capture="emit('finishDepthInteraction')"
              @pointercancel.capture="emit('finishDepthInteraction')"
            >
              <Slider
                :model-value="depthOfField.blurRadius"
                :min="0"
                :max="32"
                :step="1"
                size="sm"
                label="Intensité du flou"
                show-value
                tooltip="hover"
                :formatter="(value) => `${value} px`"
                @update:model-value="(val) => emit('updateDofBlurRadius', val)"
              />
            </div>

            <div
              data-feather-control
              class="mt-2"
              @pointerdown.capture="emit('beginDepthInteraction', 'Régler la transition du flou')"
              @pointerup.capture="emit('finishDepthInteraction')"
              @pointercancel.capture="emit('finishDepthInteraction')"
            >
              <Slider
                :model-value="depthOfField.feather"
                :min="0"
                :max="600"
                :step="10"
                size="sm"
                variant="accent"
                label="Douceur de transition"
                show-value
                tooltip="hover"
                :formatter="(value) => `${value} px`"
                @update:model-value="(val) => emit('updateDofFeather', val)"
              />
            </div>

            <div class="flex items-center gap-1.5 pt-1 text-[10px] text-white/50 border-t border-white/10">
              <Icon name="info" size="xs" class="text-primary/70 shrink-0" />
              <span>Déplacez la ligne de focus directement sur le plateau.</span>
            </div>
          </template>

          <!-- État Inactif -->
          <div v-else class="flex flex-col items-center justify-center py-2 text-center gap-2">
            <Text variant="caption" class="text-[11px] text-white/60">
              Le flou de profondeur est désactivé. Activez-le pour isoler vos sujets au premier plan.
            </Text>
            <Button
              size="xs"
              variant="primary"
              class="h-7 text-xs px-3"
              @click="emit('toggleDepthOfField')"
            >
              Activer le flou
            </Button>
          </div>
        </div>
      </Popover>

      <!-- Calibrage Rig (si accessible) -->
      <IconButton
        icon="construction"
        size="xs"
        variant="ghost"
        class="size-7 text-white/70 hover:text-white"
        :active="isRigCalibrationOpen"
        aria-label="Calibrer les rigs de personnages"
        title="Calibrer les rigs de personnages"
        @click="emit('toggleRigCalibration')"
      />
    </div>

    <!-- Îlot 3 : Résolution & Annuler/Rétablir -->
    <div class="flex items-center gap-1.5 pr-2 border-r border-white/15 shrink-0">
      <Badge
        variant="neutral"
        size="sm"
        class="border-white/15 bg-black/30 font-mono text-[10px] text-white/85 px-1.5 py-0.5"
      >
        {{ stage.width }} × {{ stage.height }}
      </Badge>

      <div class="flex items-center">
        <IconButton
          icon="undo"
          size="xs"
          variant="ghost"
          class="viewport-action size-7"
          aria-label="Annuler la dernière action (Ctrl+Z)"
          title="Annuler (Ctrl+Z)"
          :disabled="!canUndo"
          @click="emit('undo')"
        />
        <IconButton
          icon="redo"
          size="xs"
          variant="ghost"
          class="viewport-action size-7"
          aria-label="Rétablir la dernière action (Ctrl+Shift+Z)"
          title="Rétablir (Ctrl+Shift+Z)"
          :disabled="!canRedo"
          @click="emit('redo')"
        />
      </div>
    </div>

    <!-- Îlot 4 : Aide & Exporter -->
    <div class="flex items-center gap-1.5 shrink-0">
      <DropdownMenu
        v-model:open="isTourMenuOpen"
        :items="tourMenuItems"
        surface="glass"
        align="end"
        class="viewport-glass border-white/15 text-white/90 shadow-glass-xl"
      >
        <template #trigger>
          <Button
            variant="ghost"
            size="xs"
            class="h-7 gap-1 px-2 text-[11px] text-white/70 hover:text-white hover:bg-white/10"
            :class="isTourMenuOpen ? 'bg-white/15 border-white/30 text-white' : ''"
            title="Visites guidées et aide"
          >
            <Icon name="help" size="xs" />
            <span class="hidden lg:inline">Aide</span>
            <Icon name="arrow_drop_down" size="xs" class="text-white/50 -mr-1" />
          </Button>
        </template>
      </DropdownMenu>

      <Button
        data-tour="export-btn"
        variant="primary"
        size="xs"
        class="h-7 gap-1 px-2.5 text-xs font-semibold shadow-sm"
        title="Exporter l'image finale (PNG / WebP 4K)"
        @click="emit('openExport')"
      >
        <Icon name="file_download" size="xs" />
        <span>Exporter</span>
      </Button>
    </div>

    <!-- Input caché pour l'import de fichier de sauvegarde -->
    <!-- eslint-disable-next-line vue/no-restricted-html-elements -- Sélecteur de fichier natif caché -->
    <input
      ref="backupFileInput"
      type="file"
      accept="application/json"
      class="hidden"
      @change="importSnapshotFile"
    />

    <!-- Dialogue de confirmation de reset app -->
    <AlertDialog
      v-model:open="isResetConfirmOpen"
      title="Réinitialiser l’application ?"
      description="Cette opération effacera tous les projets, calques, rigs personnalisés et sprites importés pour restaurer la bibliothèque d’usine. Cette action est irréversible."
      confirm-label="Réinitialiser complètement"
      cancel-label="Annuler"
      variant="danger"
      @confirm="handleResetConfirm"
    />
  </div>
</template>
