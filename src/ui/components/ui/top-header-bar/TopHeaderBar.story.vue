<script setup lang="ts">
import { ref } from 'vue'
import TopHeaderBar from './TopHeaderBar.vue'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { SegmentedControl } from '@/components/ui/segmented-control'

const activeTab = ref('codex')
const tabOptions = [
  { value: 'codex', label: 'Lore Codex', icon: 'auto_stories', badge: 14 },
  { value: 'categories', label: 'Catégories', icon: 'category', badge: 6 }
]
</script>

<template>
  <Story title="Layout/TopHeaderBar" :layout="{ type: 'single' }">
    <Variant title="Standard Command Bar">
      <div class="p-8 bg-bg-base min-h-[200px] flex flex-col gap-4">
        <TopHeaderBar>
          <template #left>
            <SegmentedControl v-model="activeTab" size="sm" :options="tabOptions" />
          </template>

          <template #right>
            <Button variant="secondary" size="sm" shape="rounded">
              <Icon name="add" size="xs" /> Entité
            </Button>
            <Button variant="primary" size="sm" shape="rounded">
              <Icon name="download" size="xs" /> Exporter
            </Button>
          </template>
        </TopHeaderBar>
      </div>
    </Variant>

    <Variant title="Glass (Opt-in)">
      <div class="p-8 bg-bg-base min-h-[200px] flex flex-col gap-4">
        <TopHeaderBar variant="glass">
          <template #left>
            <strong class="text-sm">Surface vitrée optionnelle</strong>
          </template>
          <template #right>
            <Button variant="secondary" size="sm">Action</Button>
          </template>
        </TopHeaderBar>
      </div>
    </Variant>
  </Story>
</template>
