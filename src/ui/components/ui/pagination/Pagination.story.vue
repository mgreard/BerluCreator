<script setup lang="ts">
import { ref } from 'vue'
import Pagination from './Pagination.vue'

const currentPage = ref(3)
const pageSize = ref(10)
</script>

<template>
  <Story title="Navigation/Pagination" :layout="{ type: 'single' }">
    <Variant title="Interactive Pagination & Sizes">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-2xl mx-auto"
      >
        <div class="space-y-3">
          <label class="text-xs font-semibold text-text-primary"
            >Pagination Standard avec Résumé et Sélecteur</label
          >
          <Pagination
            v-model:page="currentPage"
            v-model:items-per-page="pageSize"
            :total="156"
            show-summary
            show-page-size-select
          />
        </div>

        <div class="space-y-3 pt-4 border-t border-border-default">
          <label class="text-xs font-semibold text-text-primary"
            >Variante Glass (Verre dépoli)</label
          >
          <Pagination :page="2" :total="80" variant="glass" size="sm" />
        </div>

        <div class="space-y-3 pt-4 border-t border-border-default">
          <label class="text-xs font-semibold text-text-primary"
            >Variante Outline (Taille Large)</label
          >
          <Pagination :page="5" :total="200" variant="outline" size="lg" />
        </div>
      </div>
    </Variant>
  </Story>
</template>
