<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import type { ViewportSnapshot } from '@core/types/editor.types'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useViewportSnapshotStore } from '@/features/editor/stores/useViewportSnapshotStore'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import { toast } from '@/ui/shared/services/toast.service'
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

const buttonClasses = computed(() => {
  return cn(
    'relative inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border text-base outline-none transition-all duration-300 ease-out select-none touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    status.value === 'idle' &&
      'bg-[#0e0e18]/85 text-white/90 border-white/15 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:bg-[#1a1a2e]/90 hover:text-white hover:border-white/30 hover:shadow-[0_8px_32px_rgba(168,85,247,0.25)] hover:scale-105 active:scale-95 cursor-pointer',
    status.value === 'saving' &&
      'bg-[#0e0e18]/90 text-primary border-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.35)] cursor-wait',
    status.value === 'success' &&
      'bg-emerald-950/80 text-emerald-400 border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.45)] scale-105 cursor-default',
    status.value === 'error' &&
      'bg-rose-950/80 text-rose-400 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.35)] cursor-default',
    disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
  )
})
</script>

<template>
  <button
    type="button"
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
  </button>
</template>
