<script setup lang="ts">
import { computed } from 'vue'
import {
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationFirst,
  PaginationPrev,
  PaginationNext,
  PaginationLast,
  PaginationEllipsis
} from 'reka-ui'
import { Select } from '@/components/ui/select'
import { cn } from '@/shared/utils/cn'
import type { PaginationProps, PaginationEmits } from './types'
import { paginationButtonVariants } from './variants'

const page = defineModel<number>('page', { default: 1 })
const itemsPerPage = defineModel<number>('itemsPerPage', { default: 10 })

const {
  total,
  siblingCount = 1,
  showEdges = true,
  showControls = true,
  showSummary = false,
  showPageSizeSelect = false,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  variant = 'default',
  size = 'md',
  class: className = undefined
} = defineProps<PaginationProps>()

defineEmits<PaginationEmits>()

const startItem = computed(() => {
  if (total === 0) return 0
  return (page.value - 1) * itemsPerPage.value + 1
})

const endItem = computed(() => {
  return Math.min(page.value * itemsPerPage.value, total)
})

const formattedSelectOptions = computed(() => {
  return pageSizeOptions.map((opt) => ({
    value: `${opt}`,
    label: `${opt} / page`
  }))
})
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 select-none w-full flex-wrap',
        disabled && 'opacity-50 pointer-events-none',
        className
      )
    "
  >
    <!-- Récapitulatif textuel optionnel -->
    <div
      v-if="showSummary || showPageSizeSelect"
      class="flex items-center gap-3 text-xs text-text-muted"
    >
      <span v-if="showSummary">
        Affichage de <b class="text-text-primary">{{ startItem }}</b> à
        <b class="text-text-primary">{{ endItem }}</b> sur
        <b class="text-text-primary">{{ total }}</b>
      </span>

      <!-- Sélecteur de taille de page -->
      <div v-if="showPageSizeSelect" class="w-28 ml-1">
        <Select
          :model-value="`${itemsPerPage}`"
          :options="formattedSelectOptions"
          @update:model-value="
            (val) => {
              itemsPerPage = Number(val)
              page = 1
            }
          "
        />
      </div>
    </div>

    <!-- Composant Pagination Reka UI -->
    <PaginationRoot
      v-model:page="page"
      :total="total"
      :items-per-page="itemsPerPage"
      :sibling-count="siblingCount"
      :show-edges="showEdges"
      :disabled="disabled"
      class="flex items-center gap-1.5"
    >
      <PaginationList v-slot="{ items }" class="flex items-center gap-1.5 list-none m-0 p-0">
        <!-- Bouton Première Page -->
        <PaginationFirst
          v-if="showEdges"
          :class="cn(paginationButtonVariants({ size, variant }), 'px-2.5')"
          aria-label="Première page"
        >
          ⏮
        </PaginationFirst>

        <!-- Bouton Page Précédente -->
        <PaginationPrev
          v-if="showControls"
          :class="cn(paginationButtonVariants({ size, variant }), 'px-2.5')"
          aria-label="Page précédente"
        >
          ◀
        </PaginationPrev>

        <!-- Liste des numéros de pages & ellipses -->
        <template v-for="(item, index) in items">
          <PaginationListItem v-if="item.type === 'page'" :key="index" :value="item.value" as-child>
            <button
              :class="cn(paginationButtonVariants({ size, variant, active: item.value === page }))"
              :aria-current="item.value === page ? 'page' : undefined"
              :aria-label="`Page ${item.value}`"
            >
              {{ item.value }}
            </button>
          </PaginationListItem>

          <PaginationEllipsis
            v-else
            :key="item.type"
            :index="index"
            :class="
              cn(
                'flex items-center justify-center text-text-muted select-none',
                size === 'sm'
                  ? 'w-8 h-9 text-xs'
                  : size === 'lg'
                    ? 'w-12 h-12 text-sm'
                    : 'w-10 h-11 text-xs'
              )
            "
          >
            &#8230;
          </PaginationEllipsis>
        </template>

        <!-- Bouton Page Suivante -->
        <PaginationNext
          v-if="showControls"
          :class="cn(paginationButtonVariants({ size, variant }), 'px-2.5')"
          aria-label="Page suivante"
        >
          ▶
        </PaginationNext>

        <!-- Bouton Dernière Page -->
        <PaginationLast
          v-if="showEdges"
          :class="cn(paginationButtonVariants({ size, variant }), 'px-2.5')"
          aria-label="Dernière page"
        >
          ⏭
        </PaginationLast>
      </PaginationList>
    </PaginationRoot>
  </div>
</template>
