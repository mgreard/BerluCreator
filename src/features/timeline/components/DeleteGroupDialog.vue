<script setup lang="ts">
import { computed } from 'vue'
import type { TrackGroup } from '@core/types/timeline.types'
import { useTimelineStore } from '../stores/useTimelineStore'
import { AlertDialog } from '@/components/ui/alert-dialog'
import { toast } from '@/ui/shared/services/toast.service'

const { group = null } = defineProps<{
  group?: TrackGroup | null
}>()

const open = defineModel<boolean>('open', { default: false })
const timelineStore = useTimelineStore()

const trackCount = computed(() =>
  group
    ? timelineStore.currentSequence.tracks.filter((track) => track.groupId === group.id).length
    : 0
)

function confirmDeletion() {
  if (!group) return
  const groupName = group.name
  const preservedTrackCount = trackCount.value
  timelineStore.removeGroup(group.id, false)
  open.value = false
  toast.success(
    'Groupe supprimé',
    `« ${groupName} » a été supprimé. Ses ${preservedTrackCount} piste(s) ont été conservées.`
  )
}
</script>

<template>
  <AlertDialog
    v-model:open="open"
    :title="`Supprimer le groupe « ${group?.name ?? ''} » ?`"
    :description="`${trackCount} piste(s) seront conservées et réassignées à un autre groupe disponible, ou laissées libres.`"
    variant="danger"
    icon="delete_forever"
    confirm-text="Supprimer le groupe"
    cancel-text="Annuler"
    @confirm="confirmDeletion"
  />
</template>
