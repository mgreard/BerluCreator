<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { ViewportSnapshot } from '@core/types/editor.types'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useViewportSnapshotStore } from '@/features/editor/stores/useViewportSnapshotStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import { toast } from '@/ui/shared/services/toast.service'
import { IconButton, type IconButtonVariant } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type {
  QuicksaveStatus,
  ViewportQuicksaveButtonEmits,
  ViewportQuicksaveButtonProps
} from './types'

const { disabled = false } = defineProps<ViewportQuicksaveButtonProps>()

const emit = defineEmits<ViewportQuicksaveButtonEmits>()

const editorStore = useEditorStore()
const snapshotStore = useViewportSnapshotStore()
const projectStore = useProjectStore()
const { activeLayers } = useHierarchyResolver()

const status = ref<QuicksaveStatus>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer(): void {
  if (resetTimer !== null) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

async function triggerSave(): Promise<ViewportSnapshot | null> {
  if (disabled || status.value === 'saving') return null

  clearTimer()
  status.value = 'saving'

  try {
    editorStore.endGesture()
    const thumbnail = await captureCleanFrame(
      activeLayers.value,
      projectStore.currentProject.stage,
      'image/png',
      {
        depthOfField: editorStore.currentDocument.depthOfField,
        colorGrading: editorStore.currentDocument.colorGrading,
        shaderSettings: editorStore.currentDocument.shaderSettings
      }
    )

    const now = new Date()
    const formattedTime = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    const snapshotName = `Keyframe ${formattedTime}`

    const snapshot = await snapshotStore.createSnapshot(
      editorStore.currentDocument,
      snapshotName,
      thumbnail
    )

    status.value = 'success'
    emit('saved', snapshot)
    toast.success('Keyframe enregistrée', `« ${snapshot.name} » enregistrée avec succès.`)

    resetTimer = setTimeout(() => {
      status.value = 'idle'
      resetTimer = null
    }, 2000)

    return snapshot
  } catch (error) {
    status.value = 'error'
    const message = error instanceof Error ? error.message : 'Erreur inconnue.'
    toast.error('Échec de la sauvegarde', message)

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
  triggerSave,
  status
})

const currentIcon = computed(() => {
  switch (status.value) {
    case 'saving':
      return 'progress_activity'
    case 'success':
      return 'check'
    case 'error':
      return 'close'
    default:
      return 'save'
  }
})

const buttonTitle = computed(() => {
  switch (status.value) {
    case 'saving':
      return 'Capture et enregistrement de la keyframe...'
    case 'success':
      return 'Keyframe enregistrée avec succès !'
    case 'error':
      return 'Erreur lors de la sauvegarde rapide'
    default:
      return 'Sauvegarde rapide de la keyframe (Ctrl+S)'
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
    status.value === 'saving' && 'border-accent/50 opacity-80 cursor-wait',
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
    :aria-busy="status === 'saving'"
    :disabled="disabled || status === 'saving'"
    data-test="viewport-quicksave-btn"
    @click="triggerSave"
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
        :class="cn(status === 'saving' && 'animate-spin')"
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
