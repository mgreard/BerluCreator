<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { ViewportSnapshot } from '@core/types/editor.types'
import type { ViewportSnapshotsPanelModel } from './types'
import { useEditorStore } from '../../stores/useEditorStore'
import { useViewportSnapshotStore } from '../../stores/useViewportSnapshotStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import { toast } from '@/ui/shared/services/toast.service'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { Input } from '@/components/ui/input'
import { FormGroup } from '@/components/ui/form-group'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Text } from '@/components/ui/text'

const open = defineModel<ViewportSnapshotsPanelModel>('open', { default: false })
const editorStore = useEditorStore()
const snapshotStore = useViewportSnapshotStore()
const projectStore = useProjectStore()
const { activeLayers } = useHierarchyResolver()

const nameInputId = useId()
const name = ref('')
const isSaving = ref(false)
const loadingSnapshotId = ref<string | null>(null)

const defaultName = computed(
  () => `Vue ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
)

watch(
  () => open.value,
  async (isOpen) => {
    if (!isOpen) return
    name.value = defaultName.value
    await snapshotStore.loadSnapshots()
  },
  { immediate: true }
)

async function saveCurrentViewport() {
  if (isSaving.value) return
  isSaving.value = true
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
    const snapshot = await snapshotStore.createSnapshot(
      editorStore.currentDocument,
      name.value,
      thumbnail
    )
    name.value = defaultName.value
    toast.success(
      'Composition enregistrée',
      `« ${snapshot.name} » contient ${snapshot.layers.length} calque(s).`
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

async function loadSnapshot(snapshot: ViewportSnapshot) {
  if (loadingSnapshotId.value) return
  loadingSnapshotId.value = snapshot.id
  try {
    const layerCount = editorStore.applyViewportSnapshot(snapshot)
    toast.success('Composition chargée', `${layerCount} calque(s) restauré(s).`)
  } catch (error) {
    toast.error('Échec du chargement', error instanceof Error ? error.message : 'Erreur inconnue.')
  } finally {
    loadingSnapshotId.value = null
  }
}

async function deleteSnapshot(snapshot: ViewportSnapshot) {
  if (!confirm(`Supprimer la composition « ${snapshot.name} » ?`)) return
  try {
    await snapshotStore.deleteSnapshot(snapshot.id)
    toast.success('Composition supprimée', `« ${snapshot.name} » a été retirée.`)
  } catch (error) {
    toast.error(
      'Échec de la suppression',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  }
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(timestamp)
}
</script>

<template>
  <aside
    v-if="open"
    data-tour="saved-views-panel"
    class="viewport-glass absolute top-3 right-3 bottom-3 z-30 flex w-[380px] max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-2xl border border-white/15 text-white/90 shadow-glass-xl pointer-events-auto select-none"
    role="region"
    aria-label="Compositions et vues sauvegardées"
    @pointerdown.stop
    @dblclick.stop
    @keydown.esc.stop="open = false"
  >
    <header class="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/15 px-3">
      <div class="flex min-w-0 items-center gap-2">
        <span class="panel-icon"><Icon name="collections_bookmark" size="sm" /></span>
        <div class="min-w-0 flex-1">
          <Text as="p" variant="caption" color="primary" weight="semibold" truncate class="text-xs font-bold text-white"
            >Compositions</Text
          >
          <Text as="p" variant="caption" color="muted" truncate class="text-[10px] text-white/60"
            >Vues sauvegardées</Text
          >
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Badge variant="neutral" size="sm" class="count-badge">{{
          snapshotStore.snapshots.length
        }}</Badge>
        <IconButton
          icon="close"
          size="sm"
          variant="ghost"
          class="viewport-action size-7 text-white/60 hover:text-white"
          aria-label="Replier le panneau des compositions"
          title="Replier le panneau"
          @click="open = false"
        />
      </div>
    </header>

    <div class="shrink-0 border-b border-white/10 bg-black/10 p-3">
      <FormGroup label="Nouvelle composition" :label-for="nameInputId" class="mb-0 text-white/80">
        <div class="flex items-center gap-2">
          <Input
            :id="nameInputId"
            v-model="name"
            size="sm"
            class="min-w-0 flex-1 bg-black/25 text-xs text-white placeholder:text-white/40 border-white/10"
            :placeholder="defaultName"
            @keydown.enter="saveCurrentViewport"
          />
          <Button
            data-tour="snapshots-create-btn"
            variant="primary"
            size="sm"
            class="h-8 shrink-0 gap-1 px-2.5 shadow-sm"
            :disabled="isSaving"
            :loading="isSaving"
            title="Enregistrer la vue actuelle"
            @click="saveCurrentViewport"
          >
            <Icon name="add_a_photo" size="xs" />
            <span class="hidden min-[390px]:inline">Enregistrer</span>
          </Button>
        </div>
      </FormGroup>
      <Text as="p" variant="caption" color="muted" class="mt-1.5 text-[10px] text-white/50">
        {{ activeLayers.length }} élément(s) visible(s)
      </Text>
    </div>

    <div data-tour="snapshots-list" class="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2.5">
      <div v-if="snapshotStore.snapshots.length > 0" class="space-y-2">
        <article
          v-for="snapshot in snapshotStore.snapshots"
          :key="snapshot.id"
          class="snapshot-row group flex min-w-0 gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2 transition-all duration-200 hover:border-primary/50 hover:bg-white/10"
        >
          <div
            class="snapshot-thumbnail relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40"
          >
            <img
              v-if="snapshot.thumbnailDataUrl"
              :src="snapshot.thumbnailDataUrl"
              :alt="`Aperçu de ${snapshot.name}`"
              class="size-full object-cover"
            />
            <div v-else class="flex size-full items-center justify-center text-white/40">
              <Icon name="photo_camera" size="sm" />
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col justify-between py-0.5">
            <div class="min-w-0">
              <Text
                as="p"
                variant="caption"
                color="primary"
                weight="semibold"
                truncate
                class="text-xs font-semibold text-white/95 group-hover:text-primary"
              >
                {{ snapshot.name }}
              </Text>
              <Text as="p" variant="caption" color="muted" class="mt-0.5 text-[9px] leading-tight text-white/60">
                {{ snapshot.layers.length }} calque(s) · {{ formatDate(snapshot.createdAt) }}
              </Text>
            </div>

            <div class="mt-1.5 flex items-center justify-end gap-1">
              <Button
                variant="secondary"
                size="xs"
                class="h-6 gap-1 px-2 text-[10px]"
                :disabled="Boolean(loadingSnapshotId)"
                @click="loadSnapshot(snapshot)"
              >
                <Icon name="input" size="xs" />
                Charger
              </Button>
              <IconButton
                icon="delete"
                size="xs"
                variant="ghost"
                class="size-6 text-white/60 hover:text-danger"
                :aria-label="`Supprimer ${snapshot.name}`"
                :title="`Supprimer ${snapshot.name}`"
                @click="deleteSnapshot(snapshot)"
              />
            </div>
          </div>
        </article>
      </div>

      <EmptyState
        v-else
        icon="collections_bookmark"
        title="Aucune composition"
        description="Enregistrez la vue actuelle pour la retrouver ici."
        class="min-h-44 border border-dashed border-white/10 bg-white/5 px-3 text-white/70"
      />
    </div>

    <footer
      class="shrink-0 border-t border-white/10 px-3 py-2 text-[9px] leading-snug text-white/50 bg-black/10"
    >
      Charger une vue remplace le contenu du document courant.
    </footer>
  </aside>
</template>

<style scoped>
.panel-icon {
  display: inline-flex;
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(129 140 248 / 28%);
  border-radius: 0.55rem;
  background: rgb(129 140 248 / 11%);
  color: rgb(165 180 252);
}

.count-badge {
  min-width: 1.6rem;
  justify-content: center;
  border-color: rgb(129 140 248 / 22%);
  background: rgb(129 140 248 / 8%);
  color: rgb(165 180 252);
  font-size: 0.58rem;
}

.snapshot-thumbnail img {
  transition: transform 300ms ease-out;
}

.snapshot-row:hover .snapshot-thumbnail img {
  transform: scale(1.025);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgb(255 255 255 / 12%);
  border-radius: 9999px;
}

@media (prefers-reduced-motion: reduce) {
  .snapshot-row,
  .snapshot-thumbnail img {
    transition: none;
  }
}
</style>
