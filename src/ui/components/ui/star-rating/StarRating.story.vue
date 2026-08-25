<script setup lang="ts">
import { ref } from 'vue'
import StarRating from './StarRating.vue'
import { Fieldset } from '@/components/ui/fieldset'
import type { StarRatingProps } from './types'

const userRating = ref<number | null>(4)
const state = ref<StarRatingProps>({
  maxStars: 5,
  size: 'md',
  showValue: true,
  readonly: false,
  disabled: false
})
</script>

<template>
  <Story title="Forms/StarRating" :layout="{ type: 'single' }">
    <Variant title="Interactive & Readonly Ratings">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <Fieldset legend="Note Interactive" variant="ghost" class="mb-0">
          <StarRating v-model="userRating" v-bind="state" />
        </Fieldset>

        <Fieldset
          legend="Mode Lecture Seule (Avis Clients)"
          variant="ghost"
          class="pt-4 border-t border-border-default mb-0"
        >
          <StarRating :model-value="5" readonly show-value />
        </Fieldset>

        <Fieldset
          legend="Tailles disponibles"
          variant="ghost"
          class="pt-4 border-t border-border-default mb-0"
        >
          <div class="flex flex-col gap-3">
            <StarRating :model-value="3" size="sm" show-value />
            <StarRating :model-value="4" size="md" show-value />
            <StarRating :model-value="5" size="lg" show-value />
          </div>
        </Fieldset>
      </div>
    </Variant>
  </Story>
</template>
