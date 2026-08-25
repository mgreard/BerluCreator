<script setup lang="ts">
import { computed } from 'vue'
import {
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent
} from 'reka-ui'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { AccordionProps, AccordionEmits, AccordionItemData } from './types'

// Liaison bidirectionnelle Vue 3.5
const model = defineModel<string | string[] | undefined>()

const {
  items = [],
  type = 'single',
  collapsible = true,
  disabled = false,
  variant = 'card',
  class: className = undefined
} = defineProps<AccordionProps>()

const emit = defineEmits<AccordionEmits>()

const rootClasses = computed(() => {
  return cn(
    '@container w-full flex flex-col',
    variant === 'default' && 'divide-y divide-border-default',
    variant === 'card' && 'gap-3',
    variant === 'bordered' &&
      'border border-border-default rounded-2xl divide-y divide-border-default overflow-hidden glass-premium',
    className
  )
})

function getItemClasses(item: AccordionItemData) {
  return cn(
    'group transition-all duration-200 outline-none',
    variant === 'card' &&
      'bg-bg-surface/50 border border-border-default rounded-2xl glass hover:border-border-hover data-[state=open]:border-primary/40 overflow-hidden shadow-glass-sm',
    variant === 'default' && 'py-1',
    variant === 'bordered' && 'bg-transparent',
    item.disabled && 'opacity-50 pointer-events-none'
  )
}

function getTriggerClasses() {
  return cn(
    'flex-1 flex items-center justify-between w-full min-h-[48px] py-3.5 px-4 text-left transition-all duration-150 cursor-pointer outline-none select-none touch-manipulation',
    'focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-bg-surface-hover group-hover:bg-bg-surface-hover/50',
    variant === 'default' && 'px-1'
  )
}

function isMaterialIcon(icon?: string): boolean {
  if (!icon) return false
  return /^[a-z0-9_-]+$/.test(icon.trim()) && !icon.includes('✦')
}

function handleValueChange(val: string | string[] | undefined) {
  model.value = val
  emit('change', val)
}
</script>

<template>
  <AccordionRoot
    :type="type"
    :collapsible="type === 'single' ? collapsible : undefined"
    :model-value="model"
    :disabled="disabled"
    :class="rootClasses"
    @update:model-value="handleValueChange"
  >
    <template v-if="items && items.length > 0">
      <AccordionItem
        v-for="item in items"
        :key="item.value"
        :value="item.value"
        :disabled="item.disabled || disabled"
        :class="getItemClasses(item)"
      >
        <AccordionHeader class="flex w-full m-0">
          <AccordionTrigger :class="getTriggerClasses()">
            <!-- En-tête / Titre & Icône (Zone gauche flexible et confinée) -->
            <div class="flex items-center gap-3 flex-1 min-w-0 pr-2">
              <slot name="icon" :item="item">
                <Icon
                  v-if="item.icon && isMaterialIcon(item.icon)"
                  :name="item.icon"
                  size="sm"
                  class="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span
                  v-else-if="item.icon"
                  class="text-base shrink-0 text-primary leading-none"
                  aria-hidden="true"
                >
                  {{ item.icon }}
                </span>
              </slot>

              <div class="flex flex-col min-w-0 text-left">
                <slot name="title" :item="item">
                  <span class="font-medium text-sm text-text-primary truncate" :title="item.title">
                    {{ item.title }}
                  </span>
                </slot>
                <slot name="subtitle" :item="item">
                  <span
                    v-if="item.subtitle"
                    class="text-xs text-text-muted mt-0.5 truncate"
                    :title="item.subtitle"
                  >
                    {{ item.subtitle }}
                  </span>
                </slot>
              </div>
            </div>

            <!-- Badge & Chevron animé (Zone droite fixe et protégée) -->
            <div class="flex items-center gap-2.5 ml-3 shrink-0">
              <slot name="badge" :item="item">
                <span
                  v-if="item.badge !== undefined"
                  class="text-xs px-2 py-0.5 rounded-full bg-bg-surface-hover text-text-secondary border border-border-subtle font-medium"
                >
                  {{ item.badge }}
                </span>
              </slot>
              <slot name="chevron" :item="item">
                <Icon
                  name="expand_more"
                  size="xs"
                  class="text-text-secondary group-hover:text-text-primary transition-transform duration-200 group-data-[state=open]:rotate-180 pointer-events-none"
                  aria-hidden="true"
                />
              </slot>
            </div>
          </AccordionTrigger>
        </AccordionHeader>

        <!-- Contenu avec transition de hauteur dynamique fluide via CSS Var Reka UI -->
        <AccordionContent
          class="overflow-hidden text-sm text-text-secondary transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        >
          <div class="p-4 pt-2 border-t border-border-subtle/40">
            <slot :name="`item-${item.value}`" :item="item">
              <p v-if="item.content" class="m-0 leading-relaxed text-xs sm:text-sm">
                {{ item.content }}
              </p>
            </slot>
          </div>
        </AccordionContent>
      </AccordionItem>
    </template>

    <slot v-else />
  </AccordionRoot>
</template>
