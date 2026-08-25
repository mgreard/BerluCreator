<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Modal } from '@/components/ui/modal'
import { FormGroup } from '@/components/ui/form-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTimelineStore } from '../stores/useTimelineStore'
import type { TrackGroupColor } from '@core/types/timeline.types'

const openModel = defineModel<boolean>('open')
const defaultModel = defineModel<boolean>()

const isOpen = computed({
  get: () => openModel.value ?? defaultModel.value ?? false,
  set: (val: boolean) => {
    if (openModel.value !== undefined) openModel.value = val
    if (defaultModel.value !== undefined) defaultModel.value = val
    if (openModel.value === undefined && defaultModel.value === undefined) {
      openModel.value = val
    }
  }
})

const timelineStore = useTimelineStore()

const groupName = ref('')
const groupZIndex = ref(20)
const selectedColor = ref<TrackGroupColor>('indigo')

const colorOptions: { id: TrackGroupColor; label: string; class: string }[] = [
  { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500 hover:ring-indigo-400' },
  { id: 'emerald', label: 'Émeraude', class: 'bg-emerald-500 hover:ring-emerald-400' },
  { id: 'amber', label: 'Ambre', class: 'bg-amber-500 hover:ring-amber-400' },
  { id: 'rose', label: 'Rose', class: 'bg-rose-500 hover:ring-rose-400' },
  { id: 'blue', label: 'Bleu', class: 'bg-blue-500 hover:ring-blue-400' },
  { id: 'purple', label: 'Pourpre', class: 'bg-purple-500 hover:ring-purple-400' },
  { id: 'cyan', label: 'Cyan', class: 'bg-cyan-500 hover:ring-cyan-400' }
]

watch(isOpen, (open) => {
  if (open) {
    groupName.value = ''
    const currentGroups = timelineStore.currentSequence.groups || []
    const nextZ = currentGroups.length > 0 ? Math.max(...currentGroups.map((g) => g.zIndex)) + 10 : 20
    groupZIndex.value = nextZ
    selectedColor.value = 'indigo'
  }
})

function handleCreate() {
  if (!groupName.value.trim()) return
  timelineStore.addGroup(groupName.value.trim(), Number(groupZIndex.value), selectedColor.value)
  isOpen.value = false
}
</script>

<template>
  <Modal
    v-model:open="isOpen"
    title="Nouveau Groupe de Pistes"
    subtitle="Regroupez des pistes de sprites pour les ordonner et les déplacer ensemble."
    size="sm"
    surface="glass"
  >
    <form class="space-y-4" @submit.prevent="handleCreate">
      <FormGroup label="Nom du groupe" hint="Ex: Personnage 2, Bureau Plateau, Accessoires Front">
        <Input
          v-model="groupName"
          placeholder="Nom du groupe..."
          required
          autofocus
        />
      </FormGroup>

      <FormGroup label="Z-Index Global (Profondeur sur le Canvas)" hint="Définit la superposition globale par rapport aux autres groupes.">
        <Input
          v-model.number="groupZIndex"
          type="number"
          min="0"
          max="100"
          step="5"
          required
        />
      </FormGroup>

      <FormGroup label="Couleur de repère">
        <div class="flex items-center gap-2 pt-1">
          <button
            v-for="color in colorOptions"
            :key="color.id"
            type="button"
            class="w-6 h-6 rounded-full transition-all cursor-pointer focus:outline-none"
            :class="[
              color.class,
              selectedColor === color.id ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
            ]"
            :title="color.label"
            @click="selectedColor = color.id"
          />
        </div>
      </FormGroup>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle/60">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          @click="isOpen = false"
        >
          Annuler
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          :disabled="!groupName.trim()"
        >
          Créer le groupe
        </Button>
      </div>
    </form>
  </Modal>
</template>
