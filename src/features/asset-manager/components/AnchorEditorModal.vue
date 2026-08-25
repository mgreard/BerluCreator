<script setup lang="ts">
import { ref } from 'vue'
import type { Asset, AnchorPoint, AnchorPointType } from '@core/types/asset.types'
import { useAssetStore } from '../stores/useAssetStore'
import AnchorCanvas from './AnchorCanvas.vue'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'

const { asset, open = false } = defineProps<{
  asset: Asset | null
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const assetStore = useAssetStore()
const currentAnchorName = ref('neck')
const currentAnchorType = ref<AnchorPointType>('socket')
const editingAnchors = ref<AnchorPoint[]>(asset ? [...asset.anchors] : [])

const anchorTypeOptions = [
  { value: 'socket', label: 'Socket (Point récepteur / accueil)' },
  { value: 'mount', label: 'Mount (Point d’accroche / attache)' }
]

function onUpdateAnchors(newAnchors: AnchorPoint[]) {
  editingAnchors.value = [...newAnchors]
}

function removeAnchor(id: string) {
  editingAnchors.value = editingAnchors.value.filter((a) => a.id !== id)
}

async function saveChanges() {
  if (asset) {
    await assetStore.updateAnchors(asset.id, editingAnchors.value)
  }
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="xl"
    title="Éditeur de Points d'Ancrage Interactif"
    description="Cliquez directement sur l'image pour positionner ou ajuster les points d'ancrage (Mount / Socket)."
    @update:open="emit('update:open', $event)"
  >
    <div v-if="asset" class="flex flex-col md:flex-row gap-4">
      <!-- Zone Canvas Interactive -->
      <div class="flex-1">
        <AnchorCanvas
          :asset="asset"
          :current-anchor-name="currentAnchorName"
          :current-anchor-type="currentAnchorType"
          @update-anchors="onUpdateAnchors"
        />
      </div>

      <!-- Panneau de Contrôle des Ancres -->
      <div class="w-full md:w-72 flex flex-col gap-3 p-3 bg-surface/50 rounded-xl border border-border/40">
        <h4 class="text-xs font-semibold text-foreground uppercase tracking-wider">
          Configuration du Point Actif
        </h4>

        <div class="space-y-1">
          <label class="text-[11px] text-muted-foreground">Nom du Point :</label>
          <Input v-model="currentAnchorName" size="sm" placeholder="ex: neck, mouth, eyes..." />
        </div>

        <div class="space-y-1">
          <label class="text-[11px] text-muted-foreground">Type d'Ancre :</label>
          <Select
            v-model="currentAnchorType"
            :options="anchorTypeOptions"
            size="sm"
          />
        </div>

        <div class="border-t border-border/40 pt-2 flex flex-col gap-2 flex-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-foreground">Points d'ancrage :</span>
            <Badge variant="outline" size="sm">{{ editingAnchors.length }}</Badge>
          </div>

          <div class="max-h-44 overflow-y-auto space-y-1 pr-1">
            <div
              v-for="anchor in editingAnchors"
              :key="anchor.id"
              class="flex items-center justify-between p-1.5 rounded-lg border border-border/40 bg-surface/60 text-xs"
            >
              <div class="flex items-center gap-1.5 truncate">
                <span
                  class="w-2 h-2 rounded-full"
                  :class="anchor.type === 'socket' ? 'bg-sky-400' : 'bg-rose-500'"
                />
                <span class="font-medium truncate">{{ anchor.name }}</span>
                <span class="text-[10px] text-muted-foreground font-mono">
                  ({{ anchor.x }}, {{ anchor.y }})
                </span>
              </div>
              <IconButton
                icon="delete"
                size="xs"
                variant="ghost"
                title="Supprimer cette ancre"
                @click="removeAnchor(anchor.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" @click="emit('update:open', false)">
          Annuler
        </Button>
        <Button variant="primary" size="sm" @click="saveChanges">
          <Icon name="check" size="sm" />
          Enregistrer les ancres
        </Button>
      </div>
    </template>
  </Modal>
</template>
