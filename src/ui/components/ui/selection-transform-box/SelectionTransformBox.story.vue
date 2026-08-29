<script setup lang="ts">
import { ref } from 'vue'
import SelectionTransformBox from './SelectionTransformBox.vue'
import type { SelectionTransformValue } from './types'

const transform = ref<SelectionTransformValue>({
  x: 120,
  y: 80,
  scaleX: 1,
  scaleY: 1,
  rotation: 0
})

function onTransform(val: SelectionTransformValue): void {
  transform.value = val
}
</script>

<template>
  <Story title="SelectionTransformBox">
    <Variant title="Boîte de transformation interactive">
      <div class="relative h-[600px] w-full bg-bg-base/80 p-8 flex items-center justify-center overflow-hidden">
        <div class="relative h-[500px] w-[500px] border border-dashed border-white/20 bg-black/40 rounded-lg">
          <SelectionTransformBox
            :width="200"
            :height="240"
            :x="transform.x"
            :y="transform.y"
            :scale-x="transform.scaleX"
            :scale-y="transform.scaleY"
            :rotation="transform.rotation"
            :active="true"
            label="Tête active"
            @transform="onTransform"
          >
            <div class="h-full w-full rounded bg-primary/20 flex items-center justify-center border border-primary/40 text-xs font-semibold text-white">
              Sprite Enveloppé
            </div>
          </SelectionTransformBox>
        </div>
      </div>
    </Variant>
  </Story>
</template>
