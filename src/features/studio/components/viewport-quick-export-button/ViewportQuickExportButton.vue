<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import { toast } from '@/ui/shared/services/toast.service'
import { IconButton, type IconButtonVariant } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type {
  QuickExportStatus,
  ViewportQuickExportButtonEmits,
  ViewportQuickExportButtonProps
} from './types'

const { disabled = false } = defineProps<ViewportQuickExportButtonProps>()

const emit = defineEmits<ViewportQuickExportButtonEmits>()

const editorStore = useEditorStore()
const projectStore = useProjectStore()
const { activeLayers } = useHierarchyResolver()

const stage = computed(() => projectStore.currentProject.stage)

const status = ref<QuickExportStatus>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer(): void {
  if (resetTimer !== null) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

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

async function triggerExport(): Promise<string | null> {
  if (disabled || status.value === 'exporting') return null

  clearTimer()
  status.value = 'exporting'

  try {
    editorStore.endGesture()
    const camera = editorStore.currentDocument.camera
    const outputResolution = get1080pExportResolution(stage.value, camera)

    const dataUrl = await captureCleanFrame(activeLayers.value, stage.value, 'image/png', {
      camera,
      depthOfField: editorStore.currentDocument.depthOfField,
      colorGrading: editorStore.currentDocument.colorGrading,
      shaderSettings: editorStore.currentDocument.shaderSettings,
      outputResolution
    })

    const link = document.createElement('a')
    link.href = dataUrl
    const docName =
      editorStore.currentDocument.name.toLowerCase().replace(/\s+/g, '-') || 'viewport'
    const now = new Date()
    const time = now
      .toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      .replace(/:/g, '')
    link.download = `berlu_creator_${docName}_${time}_1080p.png`
    link.click()

    status.value = 'success'
    emit('exported', dataUrl)
    toast.success('Rendu PNG 1080p exporté', 'Capture d’image générée avec succès.')

    resetTimer = setTimeout(() => {
      status.value = 'idle'
      resetTimer = null
    }, 2000)

    return dataUrl
  } catch (error) {
    status.value = 'error'
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    toast.error('Échec de l’export PNG', message)

    resetTimer = setTimeout(() => {
      status.value = 'idle'
      resetTimer = null
    }, 2000)

    return null
  }
}

onUnmounted(() => {
  clearTimer()
})

defineExpose({
  triggerExport,
  status
})

const currentIcon = computed(() => {
  switch (status.value) {
    case 'exporting':
      return 'progress_activity'
    case 'success':
      return 'check'
    case 'error':
      return 'close'
    default:
      return 'image'
  }
})

const buttonTitle = computed(() => {
  switch (status.value) {
    case 'exporting':
      return 'Génération du rendu PNG 1080p en cours...'
    case 'success':
      return 'Rendu PNG 1080p exporté avec succès !'
    case 'error':
      return 'Erreur lors de l’export PNG'
    default:
      return 'Export PNG rapide 1080p (Cadrage caméra)'
  }
})

const buttonVariant = computed<IconButtonVariant>(() => {
  if (status.value === 'error') return 'destructive'
  return 'primary'
})

const buttonClasses = computed(() => {
  return cn(
    'shadow-glass-md transition-all duration-200 ease-out focus-visible:outline-accent',
    status.value === 'idle' &&
      'border-accent/40 font-bold hover:shadow-glass-lg hover:scale-105 active:scale-95 cursor-pointer',
    status.value === 'exporting' && 'border-accent/50 opacity-80 cursor-wait',
    status.value === 'success' &&
      'bg-emerald-950/80 text-emerald-400 border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.45)] scale-105 cursor-default hover:bg-emerald-950/80 hover:text-emerald-400',
    status.value === 'error' &&
      'bg-rose-950/80 text-rose-400 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] cursor-default hover:bg-rose-950/80 hover:text-rose-400'
  )
})
</script>

<template>
  <IconButton
    size="md"
    :variant="buttonVariant"
    :class="buttonClasses"
    :title="buttonTitle"
    :aria-label="buttonTitle"
    :aria-busy="status === 'exporting'"
    :disabled="disabled || status === 'exporting'"
    data-test="viewport-quick-export-btn"
    @click="triggerExport"
    @pointerdown.stop
    @dblclick.stop
  >
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-75 rotate-12"
      enter-to-class="opacity-100 scale-100 rotate-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 rotate-0"
      leave-to-class="opacity-0 scale-75 -rotate-12"
    >
      <Icon
        :key="currentIcon"
        :name="currentIcon"
        size="md"
        :class="cn(status === 'exporting' && 'animate-spin')"
      />
    </Transition>

    <!-- Anneau pulsant subtil lors du succès -->
    <span
      v-if="status === 'success'"
      class="absolute inset-0 rounded-full border border-emerald-400/80 animate-ping pointer-events-none opacity-50"
      aria-hidden="true"
    />
  </IconButton>
</template>
