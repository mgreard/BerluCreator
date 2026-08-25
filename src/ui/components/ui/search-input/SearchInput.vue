<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { IconButton } from '@/components/ui/icon-button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { SearchInputProps, SearchInputEmits } from './types'

const model = defineModel<string>({ default: '' })

const {
  placeholder = 'Rechercher...',
  size = 'md',
  disabled = false,
  clearable = true,
  class: className = undefined
} = defineProps<SearchInputProps>()

const emit = defineEmits<SearchInputEmits>()

function handleClear() {
  model.value = ''
  emit('clear')
}
</script>

<template>
  <Input
    v-model="model"
    type="search"
    :placeholder="placeholder"
    :size="size"
    :disabled="disabled"
    :class="cn('w-full', className)"
  >
    <template #prefix>
      <Icon name="search" size="xs" class="text-text-muted" />
    </template>

    <template v-if="clearable && model" #suffix>
      <IconButton
        variant="ghost"
        size="sm"
        aria-label="Effacer la recherche"
        title="Effacer la recherche"
        class="w-5 h-5 text-xs text-text-muted hover:text-text-primary"
        @click="handleClear"
      >
        ×
      </IconButton>
    </template>
  </Input>
</template>
