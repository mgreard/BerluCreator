<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { zipSync } from 'fflate'
import { useProjectStore } from '../stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import {
  dataUrlToBytes,
  formatKeyframeFilename,
  getChangedKeyframeStepIds,
  sanitizeExportPrefix
} from '../services/keyframe-export.service'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Input } from '@/components/ui/input'
import { FormGroup } from '@/components/ui/form-group'
import { toast } from '@/ui/shared/services/toast.service'

const open = defineModel<boolean>('open', { default: false })

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()
const { activeLayers } = useHierarchyResolver()

const stage = computed(() => projectStore.currentProject.stage)
const isExporting = ref(false)
const exportPrefix = ref('keyframe')
const exportProgress = ref(0)
const changedStepIds = computed(() => getChangedKeyframeStepIds(timelineStore.currentSequence))

function downloadJson() {
  const exportPayload = {
    stage: projectStore.currentProject.stage,
    sequence: timelineStore.currentSequence,
    assetsMetadata: assetStore.assets,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  }

  const jsonStr = JSON.stringify(exportPayload, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'berlu_creator_export.json'
  link.click()
  URL.revokeObjectURL(url)
}

async function captureCurrentFrame() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const dataUrl = await captureCleanFrame(activeLayers.value, stage.value, 'image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `berlu_creator_${timelineStore.activeStep?.label.toLowerCase().replace(/\s+/g, '-') ?? 'etape'}.png`
    link.click()
  } catch (error) {
    console.error('Erreur lors de la capture du rendu :', error)
  } finally {
    isExporting.value = false
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

async function exportChangedKeyframes() {
  if (isExporting.value || changedStepIds.value.length === 0) return
  isExporting.value = true
  exportProgress.value = 0
  const previousStepId = timelineStore.activeStep?.id
  const stepIds = [...changedStepIds.value]

  try {
    timelineStore.commitTransformSession(false)
    const files: Record<string, Uint8Array> = {}

    for (const [index, stepId] of stepIds.entries()) {
      timelineStore.selectStep(stepId)
      await nextTick()
      const dataUrl = await captureCleanFrame(activeLayers.value, stage.value, 'image/png')
      files[formatKeyframeFilename(exportPrefix.value, index + 1, stepIds.length)] = dataUrlToBytes(dataUrl)
      exportProgress.value = index + 1
    }

    const archive = zipSync(files, { level: 0 })
    const archiveBlob = new Blob([new Uint8Array(archive)], { type: 'application/zip' })
    downloadBlob(archiveBlob, `${sanitizeExportPrefix(exportPrefix.value)}-keyframes.zip`)
    toast.success(
      'Export terminé',
      `${stepIds.length} étape(s) contenant un changement ont été exportées.`
    )
  } catch (error) {
    toast.error(
      'Échec de l’export',
      error instanceof Error ? error.message : 'Impossible de générer les keyframes.'
    )
  } finally {
    if (previousStepId) timelineStore.selectStep(previousStepId)
    isExporting.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="md"
    title="Exporter la séquence"
    subtitle="Exportez les étapes discrètes ou capturez le rendu actif."
  >
    <div class="space-y-4 text-xs">
      <div class="p-3 rounded-lg border border-border/40 bg-surface/40 flex items-center justify-between">
        <div>
          <Heading as="h4" variant="sm" class="font-semibold text-foreground">Structure complète du studio (JSON)</Heading>
          <Text variant="caption" color="muted" class="text-[11px] mt-0.5">
            Inclut les pistes, ancres, keyframes et métadonnées d'assets.
          </Text>
        </div>
        <Button size="sm" variant="secondary" class="gap-1.5" @click="downloadJson">
          <Icon name="data_object" size="xs" />
          <span>Télécharger JSON</span>
        </Button>
      </div>

      <div class="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <Heading as="h4" variant="sm" class="font-semibold text-foreground">
              Export en masse des changements
            </Heading>
            <Text variant="caption" color="muted" class="text-[11px] mt-0.5">
              Seules les étapes où l’état ou le sprite visible change sont incluses dans l’archive ZIP.
            </Text>
          </div>
          <Badge variant="accent" size="sm">
            {{ changedStepIds.length }} image(s)
          </Badge>
        </div>

        <FormGroup label="Préfixe des fichiers" helper-text="Exemple : episode-01.png, episode-02.png">
          <Input
            v-model="exportPrefix"
            size="sm"
            placeholder="keyframe"
            maxlength="60"
            autocomplete="off"
          />
        </FormGroup>

        <div class="flex items-center justify-between gap-3">
          <Text v-if="isExporting" variant="caption" color="muted">
            Génération {{ exportProgress }} / {{ changedStepIds.length }}…
          </Text>
          <span v-else />
          <Button
            size="sm"
            variant="primary"
            class="gap-1.5"
            :loading="isExporting"
            :disabled="isExporting || changedStepIds.length === 0"
            @click="exportChangedKeyframes"
          >
            <Icon name="folder_zip" size="xs" />
            <span>Exporter les changements</span>
          </Button>
        </div>
      </div>

      <div class="p-3 rounded-lg border border-border/40 bg-surface/40 flex items-center justify-between">
        <div>
          <Heading as="h4" variant="sm" class="font-semibold text-foreground">Instantané PNG de l’étape active</Heading>
          <Text variant="caption" color="muted" class="text-[11px] mt-0.5">
            Rendu haute résolution de {{ timelineStore.activeStep?.label ?? 'l’étape active' }}, sans repères d’édition.
          </Text>
        </div>
        <Button
          size="sm"
          variant="secondary"
          class="gap-1.5"
          :disabled="isExporting"
          @click="captureCurrentFrame"
        >
          <Icon name="photo_camera" size="xs" />
          <span>{{ isExporting ? 'Capture en cours...' : 'Capturer PNG' }}</span>
        </Button>
      </div>

      <div class="border-t border-border/40 pt-3 flex items-center justify-between text-muted-foreground text-[11px]">
        <span>{{ timelineStore.orderedSteps.length }} étape(s)</span>
        <Badge variant="neutral" size="sm">
          Séquence discrète
        </Badge>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <Button variant="ghost" size="sm" @click="open = false">
          Fermer
        </Button>
      </div>
    </template>
  </Modal>
</template>
