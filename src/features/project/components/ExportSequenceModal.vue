<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { useTimelineStore } from '@/features/timeline/stores/useTimelineStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Badge } from '@/components/ui/badge'

const { open = false } = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const projectStore = useProjectStore()
const timelineStore = useTimelineStore()
const assetStore = useAssetStore()

const isExporting = ref(false)

function downloadJson() {
  const exportPayload = {
    project: projectStore.currentProject,
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
  link.download = `${projectStore.currentProject.name.toLowerCase().replace(/\s+/g, '_')}_export.json`
  link.click()
  URL.revokeObjectURL(url)
}

function captureCurrentFrame() {
  const canvas = document.querySelector('canvas')
  if (!canvas) return

  const dataUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = `berlu_frame_${timelineStore.playback.currentTimeMs}ms.png`
  link.click()
}
</script>

<template>
  <Modal
    :open="open"
    size="md"
    title="Exporter la Séquence Stop-Motion"
    description="Exportez les données de séquence ou capturez les rendus d'animation."
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4 text-xs">
      <div class="p-3 rounded-lg border border-border/40 bg-surface/40 flex items-center justify-between">
        <div>
          <h4 class="font-semibold text-foreground">Structure Complète du Projet (JSON)</h4>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            Inclut les pistes, ancres, keyframes et métadonnées d'assets.
          </p>
        </div>
        <Button size="sm" variant="secondary" class="gap-1.5" @click="downloadJson">
          <Icon name="data_object" size="xs" />
          <span>Télécharger JSON</span>
        </Button>
      </div>

      <div class="p-3 rounded-lg border border-border/40 bg-surface/40 flex items-center justify-between">
        <div>
          <h4 class="font-semibold text-foreground">Instantané PNG de l'Image Actuelle</h4>
          <p class="text-[11px] text-muted-foreground mt-0.5">
            Rendu haute résolution au timecode {{ (timelineStore.playback.currentTimeMs / 1000).toFixed(2) }}s.
          </p>
        </div>
        <Button size="sm" variant="secondary" class="gap-1.5" @click="captureCurrentFrame">
          <Icon name="photo_camera" size="xs" />
          <span>Capturer PNG</span>
        </Button>
      </div>

      <div class="border-t border-border/40 pt-3 flex items-center justify-between text-muted-foreground text-[11px]">
        <span>Durée totale : {{ (timelineStore.currentSequence.durationMs / 1000).toFixed(1) }}s</span>
        <Badge variant="outline" size="sm">
          {{ timelineStore.currentSequence.fps }} FPS
        </Badge>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <Button variant="ghost" size="sm" @click="emit('update:open', false)">
          Fermer
        </Button>
      </div>
    </template>
  </Modal>
</template>
