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
      { depthOfField: editorStore.currentDocument.depthOfField }
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
    open.value = false
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
  <section
    data-tour="saved-views-panel"
    class="saved-views-panel flex h-full min-w-0 flex-col border-l border-border-subtle bg-bg-surface/30 backdrop-blur-xl"
    aria-label="Compositions et vues sauvegardées"
  >
    <header class="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3">
      <span class="panel-icon"><Icon name="collections_bookmark" size="sm" /></span>
      <div class="min-w-0 flex-1">
        <Text as="p" variant="caption" color="primary" weight="semibold" truncate class="text-xs"
          >Compositions</Text
        >
        <Text as="p" variant="caption" color="muted" truncate class="text-[10px]"
          >Vues sauvegardées</Text
        >
      </div>
      <Badge variant="neutral" size="sm" class="count-badge">{{
        snapshotStore.snapshots.length
      }}</Badge>
      <IconButton
        icon="right_panel_close"
        size="sm"
        variant="ghost"
        aria-label="Replier le panneau des compositions"
        title="Replier le panneau"
        @click="open = false"
      />
    </header>

    <div class="shrink-0 border-b border-border-subtle/70 p-3">
      <FormGroup label="Nouvelle composition" :label-for="nameInputId" class="mb-0">
        <div class="flex items-center gap-2">
          <Input
            :id="nameInputId"
            v-model="name"
            size="sm"
            class="min-w-0 flex-1"
            :placeholder="defaultName"
            @keydown.enter="saveCurrentViewport"
          />
          <Button
            variant="primary"
            size="sm"
            class="h-8 shrink-0 gap-1 px-2"
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
      <Text as="p" variant="caption" color="muted" class="mt-1.5 text-[10px]">
        {{ activeLayers.length }} élément(s) visible(s)
      </Text>
    </div>

    <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2.5">
      <div v-if="snapshotStore.snapshots.length > 0" class="space-y-2">
        <article
          v-for="snapshot in snapshotStore.snapshots"
          :key="snapshot.id"
          class="snapshot-row group flex min-w-0 gap-2.5 rounded-xl border p-2"
        >
          <div
            class="snapshot-thumbnail relative aspect-video w-28 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-bg-base"
          >
            <img
              v-if="snapshot.thumbnailDataUrl"
              :src="snapshot.thumbnailDataUrl"
              :alt="`Aperçu de ${snapshot.name}`"
              class="size-full object-cover"
            />
            <div v-else class="flex size-full items-center justify-center text-text-muted">
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
                class="text-xs"
              >
                {{ snapshot.name }}
              </Text>
              <Text as="p" variant="caption" color="muted" class="mt-0.5 text-[9px] leading-tight">
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
                class="size-6 text-text-muted hover:text-danger"
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
        class="min-h-44 border border-dashed border-border-subtle bg-bg-base/20 px-3"
      />
    </div>

    <footer
      class="shrink-0 border-t border-border-subtle/70 px-3 py-2 text-[9px] leading-snug text-text-muted"
    >
      Charger une vue remplace le contenu du document courant.
    </footer>
  </section>
</template>

<style scoped>
.saved-views-panel {
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 15%),
    -12px 0 32px rgb(0 0 0 / 14%);
}

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

.snapshot-row {
  border-color: rgb(255 255 255 / 8%);
  background: rgb(18 18 26 / 30%);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 8%);
  transition:
    border-color 300ms ease-out,
    background-color 300ms ease-out,
    box-shadow 300ms ease-out;
}

.snapshot-row:hover {
  border-color: rgb(129 140 248 / 34%);
  background: rgb(129 140 248 / 7%);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 15%),
    0 8px 20px rgb(0 0 0 / 12%);
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
