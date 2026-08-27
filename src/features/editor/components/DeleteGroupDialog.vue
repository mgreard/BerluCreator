<script setup lang="ts">
import { computed } from 'vue'
import type { EditorGroup } from '@core/types/editor.types'
import { useEditorStore } from '../stores/useEditorStore'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { toast } from '@/ui/shared/services/toast.service'

const { group = null } = defineProps<{
  group?: EditorGroup | null
}>()

const open = defineModel<boolean>('open', { default: false })
const editorStore = useEditorStore()

const layerCount = computed(() =>
  group
    ? editorStore.currentDocument.layers.filter((layer) => layer.groupId === group.id).length
    : 0
)

function confirmDeletion() {
  if (!group) return
  const groupName = group.name
  const count = layerCount.value
  editorStore.deleteGroup(group.id, false)
  open.value = false
  toast.success(
    'Groupe supprimé',
    `« ${groupName} » a été supprimé. Ses ${count} calque(s) ont été conservés.`
  )
}
</script>

<template>
  <AlertDialog
    v-model:open="open"
    :title="`Supprimer le groupe « ${group?.name ?? ''} » ?`"
    :description="`${layerCount} calque(s) seront conservés et réassignés au premier groupe disponible.`"
    variant="danger"
    icon="delete_forever"
    confirm-text="Supprimer le groupe"
    cancel-text="Annuler"
    @confirm="confirmDeletion"
  />
</template>
