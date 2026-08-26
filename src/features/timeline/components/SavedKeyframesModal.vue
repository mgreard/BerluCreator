<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useTimelineStore } from '../stores/useTimelineStore'
import { useSavedKeyframeStore } from '../stores/useSavedKeyframeStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import type { SavedKeyframePreset } from '@core/types/timeline.types'
import { formatTimecode } from '@/lib/utils'
import { toast } from '@/ui/shared/services/toast.service'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { FormGroup } from '@/components/ui/form-group'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Heading } from '@/components/ui/heading'
import { Text } from '@/components/ui/text'

const open = defineModel<boolean>('open', { default: false })
const timelineStore = useTimelineStore()
const savedKeyframeStore = useSavedKeyframeStore()
const projectStore = useProjectStore()
const { activeLayers } = useHierarchyResolver()
const nameInputId = useId()
const name = ref('')
const isSaving = ref(false)
const loadingPresetId = ref<string | null>(null)

const defaultName = computed(
  () => `Keyframe ${formatTimecode(timelineStore.playback.currentTimeMs)}`
)

watch(
  () => open.value,
  async (isOpen) => {
    if (!isOpen) return
    name.value = defaultName.value
    await savedKeyframeStore.loadPresets()
  },
  { immediate: true }
)

async function saveCurrentKeyframe() {
  if (isSaving.value || activeLayers.value.length === 0) return
  isSaving.value = true
  try {
    timelineStore.pause()
    timelineStore.commitTransformSession(false)
    const thumbnail = await captureCleanFrame(
      activeLayers.value,
      projectStore.currentProject.stage,
      'image/png'
    )
    const preset = await savedKeyframeStore.saveCurrentPose(
      timelineStore.currentSequence,
      timelineStore.playback.currentTimeMs,
      name.value,
      thumbnail
    )
    name.value = defaultName.value
    toast.success(
      'Keyframe enregistrée',
      `« ${preset.name} » contient ${countSprites(preset)} sprite(s).`
    )
  } catch (error) {
    toast.error(
      'Échec de l’enregistrement',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    isSaving.value = false
  }
}

async function loadPreset(preset: SavedKeyframePreset) {
  if (loadingPresetId.value) return
  loadingPresetId.value = preset.id
  try {
    const spriteCount = await timelineStore.applySavedKeyframe(preset)
    toast.success(
      'Keyframe chargée',
      `${spriteCount} sprite(s) appliqué(s) à ${formatTimecode(timelineStore.playback.currentTimeMs)}.`
    )
    open.value = false
  } catch (error) {
    toast.error(
      'Échec du chargement',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    loadingPresetId.value = null
  }
}

async function deletePreset(preset: SavedKeyframePreset) {
  if (!confirm(`Supprimer la keyframe enregistrée « ${preset.name} » ?`)) return
  await savedKeyframeStore.deletePreset(preset.id)
  toast.success('Keyframe supprimée', `« ${preset.name} » a été retirée de la bibliothèque.`)
}

function countSprites(preset: SavedKeyframePreset) {
  return preset.tracks.reduce((count, track) => count + track.sprites.length, 0)
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(timestamp)
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="xl"
    title="Keyframes enregistrées"
    subtitle="Sauvegardez une pose du canvas ou appliquez-la au timecode courant. Cette bibliothèque ne restaure ni les assets ni l’état complet de l’application."
  >
    <div class="space-y-5">
      <section class="rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div class="flex items-end gap-3">
          <FormGroup
            label="Nom de la keyframe"
            :label-for="nameInputId"
            class="mb-0 min-w-0 flex-1"
          >
            <Input
              :id="nameInputId"
              v-model="name"
              size="sm"
              :placeholder="defaultName"
              @keydown.enter="saveCurrentKeyframe"
            />
          </FormGroup>
          <Button
            variant="primary"
            size="sm"
            class="gap-1.5 shrink-0"
            :disabled="isSaving || activeLayers.length === 0"
            @click="saveCurrentKeyframe"
          >
            <Icon name="add_a_photo" size="xs" />
            {{ isSaving ? 'Capture…' : 'Enregistrer la pose actuelle' }}
          </Button>
        </div>
        <Text as="p" variant="caption" color="muted" class="mt-2 text-[11px]">
          Timecode actuel : {{ formatTimecode(timelineStore.playback.currentTimeMs) }} ·
          {{ activeLayers.length }} élément(s) visible(s)
        </Text>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <Heading as="h3" variant="sm">Bibliothèque de poses</Heading>
          <Badge variant="neutral" size="sm">{{ savedKeyframeStore.presets.length }}</Badge>
        </div>

        <div
          v-if="savedKeyframeStore.presets.length > 0"
          class="grid max-h-[52vh] grid-cols-1 gap-3 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2"
        >
          <article
            v-for="preset in savedKeyframeStore.presets"
            :key="preset.id"
            class="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface/70 shadow-glass-sm"
          >
            <div class="aspect-video bg-bg-base">
              <img
                :src="preset.thumbnailDataUrl"
                :alt="`Capture de la keyframe ${preset.name}`"
                class="h-full w-full object-contain"
              />
            </div>
            <div class="flex items-center gap-3 p-3">
              <div class="min-w-0 flex-1">
                <Text as="p" variant="caption" color="primary" weight="semibold" truncate class="text-xs">
                  {{ preset.name }}
                </Text>
                <Text as="p" variant="caption" color="muted" class="mt-0.5 text-[10px]">
                  {{ countSprites(preset) }} sprite(s) · {{ formatDate(preset.createdAt) }}
                </Text>
              </div>
              <Button
                variant="secondary"
                size="xs"
                class="gap-1"
                :disabled="Boolean(loadingPresetId)"
                @click="loadPreset(preset)"
              >
                <Icon name="input" size="xs" />
                Charger ici
              </Button>
              <IconButton
                icon="delete"
                size="xs"
                variant="ghost"
                class="text-danger hover:text-danger"
                :title="`Supprimer ${preset.name}`"
                @click="deletePreset(preset)"
              />
            </div>
          </article>
        </div>

        <EmptyState
          v-else
          icon="collections_bookmark"
          title="Aucune keyframe enregistrée"
          description="Placez la tête de lecture sur une composition utile, puis enregistrez sa pose."
          class="min-h-52 border border-dashed border-border-subtle bg-bg-base/30"
        />
      </section>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between text-[11px] text-text-muted">
        <span>Le chargement écrit la pose au timecode courant de la timeline.</span>
        <Button variant="ghost" size="sm" @click="open = false">Fermer</Button>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 9999px;
}
</style>
