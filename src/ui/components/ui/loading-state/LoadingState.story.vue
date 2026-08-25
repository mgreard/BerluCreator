<script setup lang="ts">
import { ref } from 'vue'
import LoadingState from './LoadingState.vue'
import type { LoadingStateProps } from './types'

const state = ref<LoadingStateProps>({
  message: 'Chargement des données en cours...',
  spinnerSize: '32px'
})
</script>

<template>
  <Story title="Feedback/LoadingState" :layout="{ type: 'grid', width: '360px' }">
    <Variant title="Default Message">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <LoadingState />
      </div>
    </Variant>

    <Variant title="Custom Async Sync">
      <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
        <LoadingState message="Synchronisation avec le cloud..." spinner-size="36px" />
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div class="p-8 bg-bg-surface border border-border-default rounded-xl w-full">
          <LoadingState v-bind="state" />
        </div>
      </template>
      <template #controls>
        <HstText v-model="state.message" title="Message" />
        <HstText v-model="state.spinnerSize" title="Spinner Size" />
      </template>
    </Variant>
  </Story>
</template>
