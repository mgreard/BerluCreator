<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'
import { Switch } from '@/components/ui/switch'
import { FormGroup } from '@/components/ui/form-group'
import { Select, type SelectOption } from '@/components/ui/select'
import { toast } from '@/ui/shared/services/toast.service'

const open = defineModel<boolean>('open', { default: false })

const projectStore = useProjectStore()
const editorStore = useEditorStore()
const assetStore = useAssetStore()
const { activeLayers } = useHierarchyResolver()

const stage = computed(() => projectStore.currentProject.stage)
const isExporting = ref(false)
const applyCameraFrames = ref(true)
const resolutionMode = ref<'native' | '1080p'>('native')

const resolutionOptions: SelectOption[] = [
  { value: 'native', label: 'Résolution native du cadrage' },
  { value: '1080p', label: 'Forcer en 1080p' }
]

function get1080pExportResolution(
  stageSize: { width: number; height: number },
  camera?: { enabled: boolean; width: number; height: number }
): { width: number; height: number } {
  const activeWidth = camera?.enabled ? camera.width : stageSize.width
  const activeHeight = camera?.enabled ? camera.height : stageSize.height
  const ratio = activeWidth / activeHeight
  return ratio >= 1
    ? { width: 1920, height: Math.round(1920 / ratio) }
    : { width: Math.round(1080 * ratio), height: 1080 }
}

function getCaptureOptions() {
  const camera = applyCameraFrames.value ? editorStore.currentDocument.camera : undefined
  return {
    camera,
    outputResolution: resolutionMode.value === '1080p'
      ? get1080pExportResolution(stage.value, camera)
      : undefined
  }
}

function downloadJson() {
  const exportPayload = {
    stage: projectStore.currentProject.stage,
    document: editorStore.currentDocument,
    assetsMetadata: assetStore.assets,
    exportedAt: new Date().toISOString(),
    version: '3.0.0'
  }

  const jsonStr = JSON.stringify(exportPayload, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `berlu_creator_${editorStore.currentDocument.name.toLowerCase().replace(/\s+/g, '_')}.json`
  link.click()
  URL.revokeObjectURL(url)
  toast.success('Fichier JSON exporté', 'Structure de scène et métadonnées téléchargées.')
}

async function captureCurrentFrame() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const dataUrl = await captureCleanFrame(
      activeLayers.value,
      stage.value,
      'image/png',
      getCaptureOptions()
    )
    const link = document.createElement('a')
    link.href = dataUrl
    const docName = editorStore.currentDocument.name.toLowerCase().replace(/\s+/g, '-') || 'viewport'
    link.download = `berlu_creator_${docName}.png`
    link.click()
    toast.success('Rendu PNG exporté', 'Capture d’image générée avec succès.')
  } catch (error) {
    console.error('Erreur lors de la capture du rendu :', error)
    toast.error('Erreur d’export', 'Impossible de capturer le rendu.')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="md"
    title="Exporter le document"
    subtitle="Exportez le rendu actif du plateau en PNG ou sauvegardez la structure JSON."
  >
    <div class="space-y-4 text-xs">
      <!-- Option 1: Capture PNG -->
      <div class="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div class="flex items-start justify-between gap-4">
          <div>
            <Heading as="h4" variant="sm" class="font-semibold text-foreground">
              Image PNG haute qualité
            </Heading>
            <Text variant="caption" color="muted" class="text-[11px] mt-0.5">
              Rendu net du viewport actif sans repères d’édition.
            </Text>
          </div>
          <Badge variant="accent" size="sm">PNG</Badge>
        </div>

        <div class="grid gap-3 rounded-lg border border-border-subtle bg-bg-surface/50 p-3 sm:grid-cols-[1fr_190px] sm:items-center">
          <Switch
            v-model="applyCameraFrames"
            size="sm"
            label="Appliquer le cadrage Caméra"
            description="Utilise la zone définie par la caméra si elle est active."
          />
          <FormGroup label="Format de sortie">
            <Select
              v-model="resolutionMode"
              :options="resolutionOptions"
              size="sm"
              aria-label="Format de sortie de l’image"
            />
          </FormGroup>
        </div>

        <div class="flex items-center justify-between gap-3 pt-1">
          <Text variant="caption" color="muted">
            {{ activeLayers.length }} calque(s) visible(s)
          </Text>
          <Button
            size="sm"
            variant="primary"
            class="gap-1.5"
            :loading="isExporting"
            :disabled="isExporting"
            @click="captureCurrentFrame"
          >
            <Icon name="photo_camera" size="xs" />
            <span>{{ isExporting ? 'Capture en cours…' : 'Télécharger PNG' }}</span>
          </Button>
        </div>
      </div>

      <!-- Option 2: JSON -->
      <div class="p-3 rounded-lg border border-border/40 bg-surface/40 flex items-center justify-between">
        <div>
          <Heading as="h4" variant="sm" class="font-semibold text-foreground">
            Structure de scène (JSON)
          </Heading>
          <Text variant="caption" color="muted" class="text-[11px] mt-0.5">
            Inclut les calques, groupes, positions, cadrage caméra et métadonnées d’assets.
          </Text>
        </div>
        <Button size="sm" variant="secondary" class="gap-1.5" @click="downloadJson">
          <Icon name="data_object" size="xs" />
          <span>Télécharger JSON</span>
        </Button>
      </div>

      <div class="border-t border-border/40 pt-3 flex items-center justify-between text-muted-foreground text-[11px]">
        <span>Plateau : {{ stage.width }} × {{ stage.height }}px</span>
        <Badge variant="neutral" size="sm">
          Éditeur unique
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
