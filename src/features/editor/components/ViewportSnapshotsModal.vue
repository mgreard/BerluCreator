<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import { useEditorStore } from '../stores/useEditorStore'
import { useViewportSnapshotStore } from '../stores/useViewportSnapshotStore'
import { useHierarchyResolver } from '@/features/studio/composables/useHierarchyResolver'
import { useProjectStore } from '@/features/project/stores/useProjectStore'
import { captureCleanFrame } from '@/features/studio/composables/useCanvasRenderer'
import type { ViewportSnapshot } from '@core/types/editor.types'
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
      'image/png'
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
    toast.success(
      'Composition chargée',
      `${layerCount} calque(s) restauré(s).`
    )
    open.value = false
  } catch (error) {
    toast.error(
      'Échec du chargement',
      error instanceof Error ? error.message : 'Erreur inconnue.'
    )
  } finally {
    loadingSnapshotId.value = null
  }
}

async function deleteSnapshot(snapshot: ViewportSnapshot) {
  if (!confirm(`Supprimer la composition « ${snapshot.name} » ?`)) return
  await snapshotStore.deleteSnapshot(snapshot.id)
  toast.success('Composition supprimée', `« ${snapshot.name} » a été retirée.`)
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
    title="Compositions & Vues sauvegardées"
    subtitle="Enregistrez une composition du viewport ou rechargez-la instantanément dans l’éditeur."
  >
    <div class="space-y-5">
      <section class="rounded-xl border border-primary/25 bg-primary/5 p-4">
        <div class="flex items-end gap-3">
          <FormGroup
            label="Nom de la composition"
            :label-for="nameInputId"
            class="mb-0 min-w-0 flex-1"
          >
            <Input
              :id="nameInputId"
              v-model="name"
              size="sm"
              :placeholder="defaultName"
              @keydown.enter="saveCurrentViewport"
            />
          </FormGroup>
          <Button
            variant="primary"
            size="sm"
            class="gap-1.5 shrink-0"
            :disabled="isSaving"
            @click="saveCurrentViewport"
          >
            <Icon name="add_a_photo" size="xs" />
            {{ isSaving ? 'Capture…' : 'Enregistrer la vue actuelle' }}
          </Button>
        </div>
        <Text as="p" variant="caption" color="muted" class="mt-2 text-[11px]">
          {{ activeLayers.length }} élément(s) visible(s) sur le plateau
        </Text>
      </section>

      <section>
        <div class="mb-3 flex items-center justify-between">
          <Heading as="h3" variant="sm">Bibliothèque de compositions</Heading>
          <Badge variant="neutral" size="sm">{{ snapshotStore.snapshots.length }}</Badge>
        </div>

        <div
          v-if="snapshotStore.snapshots.length > 0"
          class="grid max-h-[52vh] grid-cols-1 gap-3 overflow-y-auto pr-1 custom-scrollbar sm:grid-cols-2"
        >
          <article
            v-for="snapshot in snapshotStore.snapshots"
            :key="snapshot.id"
            class="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface/70 shadow-glass-sm"
          >
            <div class="aspect-video bg-bg-base">
              <img
                v-if="snapshot.thumbnailDataUrl"
                :src="snapshot.thumbnailDataUrl"
                :alt="`Aperçu de ${snapshot.name}`"
                class="h-full w-full object-contain"
              />
              <div v-else class="h-full w-full flex items-center justify-center text-text-muted">
                <Icon name="photo_camera" size="md" />
              </div>
            </div>
            <div class="flex items-center gap-3 p-3">
              <div class="min-w-0 flex-1">
                <Text as="p" variant="caption" color="primary" weight="semibold" truncate class="text-xs">
                  {{ snapshot.name }}
                </Text>
                <Text as="p" variant="caption" color="muted" class="mt-0.5 text-[10px]">
                  {{ snapshot.layers.length }} calque(s) · {{ formatDate(snapshot.createdAt) }}
                </Text>
              </div>
              <Button
                variant="secondary"
                size="xs"
                class="gap-1"
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
                class="text-danger hover:text-danger"
                :title="`Supprimer ${snapshot.name}`"
                @click="deleteSnapshot(snapshot)"
              />
            </div>
          </article>
        </div>

        <EmptyState
          v-else
          icon="collections_bookmark"
          title="Aucune composition enregistrée"
          description="Composez votre scène sur le plateau, puis enregistrez sa vue."
          class="min-h-52 border border-dashed border-border-subtle bg-bg-base/30"
        />
      </section>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between text-[11px] text-text-muted">
        <span>Le chargement remplace le contenu du document courant.</span>
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
