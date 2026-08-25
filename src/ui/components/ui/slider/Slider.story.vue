<script setup lang="ts">
import { ref } from 'vue'
import Slider from './Slider.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { SliderProps } from './types'

const volume = ref(65)
const rangeValues = ref([25, 75])
const verticalVal = ref(50)

const state = ref<SliderProps>({
  min: 0,
  max: 100,
  step: 1,
  variant: 'primary',
  size: 'md',
  showValue: true,
  disabled: false
})
</script>

<template>
  <Story title="Forms/Slider" :layout="{ type: 'single' }">
    <Variant title="Standard & Range Sliders">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-lg mx-auto"
      >
        <FormGroup label="Volume Audio" class="mb-0">
          <Slider v-model="volume" show-value :formatter="(v) => `${v} %`" v-bind="state" />
        </FormGroup>

        <FormGroup label="Fourchette de Prix" class="pt-4 border-t border-border-default mb-0">
          <Slider
            v-model="rangeValues"
            show-value
            :formatter="(v) => `${v} €`"
            variant="gradient"
          />
        </FormGroup>

        <FormGroup label="Mode Vertical" class="pt-4 border-t border-border-default mb-0">
          <div class="flex justify-center h-48 py-2">
            <Slider
              v-model="verticalVal"
              orientation="vertical"
              variant="success"
              tooltip="always"
            />
          </div>
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
