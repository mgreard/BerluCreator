<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue'
import type { EditorGroup, EditorLayer } from '@core/types/editor.types'
import { useEditorStore } from '@/features/editor/stores/useEditorStore'
import { useAssetStore } from '@/features/asset-manager/stores/useAssetStore'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { FormGroup } from '@/components/ui/form-group'
import { Text } from '@/components/ui/text'

const { group = null, layer = null } = defineProps<{
  group?: EditorGroup | null
  layer?: EditorLayer | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ (event: 'saved'): void }>()
const editorStore = useEditorStore()
const assetStore = useAssetStore()
const fieldId = useId()
const x = ref<string | number>(0)
const y = ref<string | number>(0)
const scaleX = ref<string | number>(1)
const scaleY = ref<string | number>(1)
const ratioLocked = ref(true)
const zIndex = ref<string | number>(0)

const layerAsset = computed(() =>
  layer ? assetStore.assets.find((asset) => asset.id === layer.assetId) ?? null : null
)
const scaleXModel = computed<string | number>({
  get: () => scaleX.value,
  set: (value) => {
    scaleX.value = value
    if (ratioLocked.value && value !== '') scaleY.value = value
  }
})
const scaleYModel = computed<string | number>({
  get: () => scaleY.value,
  set: (value) => {
    scaleY.value = value
    if (ratioLocked.value && value !== '') scaleX.value = value
  }
})

watch(
  () => [open.value, group, layer] as const,
  ([isOpen]) => {
    if (!isOpen) return
    const target = group ?? layer
    if (!target) return
    x.value = target.transform.x
    y.value = target.transform.y
    scaleX.value = target.transform.scaleX
    scaleY.value = target.transform.scaleY
    zIndex.value = target.zIndex
    ratioLocked.value = Math.abs(target.transform.scaleX - target.transform.scaleY) < 0.001
  },
  { immediate: true }
)

function clampScale(value: string | number): number {
  return Number(Math.max(0.05, Math.min(5, Number(value) || 1)).toFixed(2))
}

function save(): void {
  const transform = {
    x: Number(x.value),
    y: Number(y.value),
    scaleX: clampScale(scaleX.value),
    scaleY: clampScale(scaleY.value)
  }
  if (group) editorStore.updateGroupSettings(group.id, transform, Number(zIndex.value))
  else if (layer) editorStore.updateLayerSettings(layer.id, transform, Number(zIndex.value))
  open.value = false
  emit('saved')
}
</script>

<template>
  <Modal
    v-model:open="open"
    :title="group ? `Réglages — ${group.name}` : `Réglages — ${layerAsset?.name ?? layer?.name ?? 'Calque'}`"
    subtitle="Ajustez précisément la transformation et la profondeur."
    size="sm"
    :close-on-backdrop="false"
  >
    <div class="grid grid-cols-2 gap-4">
      <FormGroup label="Position X" :label-for="`${fieldId}-x`" class="mb-0">
        <Input :id="`${fieldId}-x`" v-model="x" type="number" />
      </FormGroup>
      <FormGroup label="Position Y" :label-for="`${fieldId}-y`" class="mb-0">
        <Input :id="`${fieldId}-y`" v-model="y" type="number" />
      </FormGroup>
      <FormGroup label="Z-index" :label-for="`${fieldId}-z`" class="mb-0">
        <Input :id="`${fieldId}-z`" v-model="zIndex" type="number" />
      </FormGroup>

      <div class="col-span-2 rounded-xl border border-border-subtle/80 bg-bg-surface/25 p-3">
        <div class="mb-3 flex items-center justify-between gap-3">
          <div>
            <Text variant="caption" class="text-xs font-semibold text-text-primary">Échelle par axe</Text>
            <Text variant="caption" color="muted" class="text-[10px]">Le verrou synchronise les proportions.</Text>
          </div>
          <IconButton
            :icon="ratioLocked ? 'link' : 'link_off'"
            :active="ratioLocked"
            size="xs"
            variant="ghost"
            :aria-label="ratioLocked ? 'Déverrouiller le ratio' : 'Verrouiller le ratio'"
            @click="ratioLocked = !ratioLocked"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <FormGroup label="Échelle X" :label-for="`${fieldId}-scale-x`" class="mb-0">
            <Input :id="`${fieldId}-scale-x`" v-model="scaleXModel" type="number" min="0.05" max="5" step="0.05" />
          </FormGroup>
          <FormGroup label="Échelle Y" :label-for="`${fieldId}-scale-y`" class="mb-0">
            <Input :id="`${fieldId}-scale-y`" v-model="scaleYModel" type="number" min="0.05" max="5" step="0.05" />
          </FormGroup>
        </div>
      </div>
    </div>

    <template #footer>
      <Button variant="secondary" @click="open = false">Annuler</Button>
      <Button variant="primary" @click="save">Appliquer</Button>
    </template>
  </Modal>
</template>
