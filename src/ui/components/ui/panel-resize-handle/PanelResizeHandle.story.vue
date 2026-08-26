<script setup lang="ts">
import { ref } from 'vue'
import PanelResizeHandle from './PanelResizeHandle.vue'

const horizontalActive = ref(false)
const verticalActive = ref(false)
</script>

<template>
  <Story title="UI/PanelResizeHandle">
    <Variant title="Orientations">
      <div class="grid min-h-80 grid-cols-2 gap-8 bg-bg-base p-8 text-text-primary">
        <section id="story-horizontal" class="relative min-h-40 rounded-xl border border-border-subtle bg-bg-surface">
          <PanelResizeHandle
            orientation="horizontal"
            controls="story-horizontal"
            label="Redimensionner horizontalement"
            :value-min="120"
            :value-max="600"
            :value-now="320"
            :active="horizontalActive"
            class="-top-1"
            @click="horizontalActive = !horizontalActive"
          />
        </section>
        <section id="story-vertical" class="relative min-h-40 rounded-xl border border-border-subtle bg-bg-surface">
          <PanelResizeHandle
            orientation="vertical"
            controls="story-vertical"
            label="Redimensionner verticalement"
            :value-min="200"
            :value-max="600"
            :value-now="320"
            :active="verticalActive"
            class="-right-1"
            @click="verticalActive = !verticalActive"
          />
        </section>
      </div>
    </Variant>
  </Story>
</template>

