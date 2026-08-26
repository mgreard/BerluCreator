<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormGroup } from '@/components/ui/form-group'

const open = defineModel<boolean>('open', { default: false })

const projectStore = useProjectStore()

const projectName = ref(projectStore.currentProject.name)
const projectDesc = ref(projectStore.currentProject.description || '')
const stageWidth = ref(projectStore.currentProject.stage.width)
const stageHeight = ref(projectStore.currentProject.stage.height)
const bgColor = ref(projectStore.currentProject.stage.backgroundColor)

function syncFromStore() {
  const proj = projectStore.currentProject
  projectName.value = proj.name
  projectDesc.value = proj.description || ''
  stageWidth.value = proj.stage.width
  stageHeight.value = proj.stage.height
  bgColor.value = proj.stage.backgroundColor
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFromStore()
    }
  },
  { immediate: true }
)

watch(
  () => projectStore.currentProject,
  () => {
    syncFromStore()
  },
  { deep: true }
)

const resolutionPresets = [
  { value: '1920x1080', label: '1920 × 1080 (16:9 Full HD)' },
  { value: '1280x720', label: '1280 × 720 (16:9 HD)' },
  { value: '1080x1080', label: '1080 × 1080 (1:1 Carré)' },
  { value: '1080x1920', label: '1080 × 1920 (9:16 Vertical / Short)' }
]

function onResolutionPresetChange(val: string | number | boolean | null) {
  if (typeof val !== 'string') return
  const [w, h] = val.split('x').map(Number)
  if (w && h) {
    stageWidth.value = w
    stageHeight.value = h
  }
}

async function save() {
  await projectStore.updateProjectMeta(projectName.value, projectDesc.value)
  await projectStore.updateStage({
    width: stageWidth.value,
    height: stageHeight.value,
    backgroundColor: bgColor.value
  })
  open.value = false
}
</script>

<template>
  <Modal
    v-model:open="open"
    size="md"
    title="Paramètres du Projet & Plateau"
    subtitle="Configurez le titre de l'émission et les dimensions du plateau."
  >
    <div class="space-y-4 text-xs">
      <FormGroup label="Nom de la Scène / Projet" label-for="project-name">
        <Input id="project-name" v-model="projectName" size="sm" />
      </FormGroup>

      <FormGroup label="Format de Rendu Vidéo">
        <Select
          :options="resolutionPresets"
          :model-value="`${stageWidth}x${stageHeight}`"
          size="sm"
          @update:model-value="onResolutionPresetChange"
        />
      </FormGroup>

      <div class="grid grid-cols-2 gap-3">
        <FormGroup label="Largeur (px)" label-for="stage-width" class="mb-0">
          <Input id="stage-width" v-model.number="stageWidth" type="number" size="sm" />
        </FormGroup>
        <FormGroup label="Hauteur (px)" label-for="stage-height" class="mb-0">
          <Input id="stage-height" v-model.number="stageHeight" type="number" size="sm" />
        </FormGroup>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" @click="open = false">
          Annuler
        </Button>
        <Button variant="primary" size="sm" @click="save">
          Enregistrer
        </Button>
      </div>
    </template>
  </Modal>
</template>
