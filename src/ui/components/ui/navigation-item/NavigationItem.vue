<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { SelectableSurface } from '@/components/ui/selectable-surface'
import { cn } from '@/shared/utils/cn'
import type {
  NavigationItemEmits,
  NavigationItemProps,
  NavigationItemSlots
} from './types'

const navigationItemVariants = cva(
  'navigation-item group flex w-full items-center justify-between rounded-lg text-left text-text-secondary',
  {
    variants: {
      density: {
        default: 'gap-2 px-2.5 py-2 text-xs font-semibold',
        compact: 'gap-1.5 px-2 py-1 text-[11px] font-medium'
      }
    },
    defaultVariants: {
      density: 'default'
    }
  }
)

const {
  as = 'button',
  label,
  icon = undefined,
  count = undefined,
  selected = false,
  disabled = false,
  density = 'default',
  accent = 'var(--color-primary)',
  class: className = undefined
} = defineProps<NavigationItemProps>()

const emit = defineEmits<NavigationItemEmits>()
defineSlots<NavigationItemSlots>()

const accentStyle = computed(() => ({ '--navigation-item-accent': accent }))
const classes = computed(() => cn(navigationItemVariants({ density }), className))
</script>

<template>
  <SelectableSurface
    :as="as"
    role="button"
    :selected="selected"
    :disabled="disabled"
    :density="density"
    :data-selected="selected"
    :style="accentStyle"
    :class="classes"
    @click="emit('click', $event)"
  >
    <span class="navigation-marker" aria-hidden="true" />
    <span class="flex min-w-0 flex-1 items-center gap-2">
      <slot name="prefix" />
      <slot name="icon">
        <span v-if="icon" class="navigation-icon" aria-hidden="true">
          <Icon :name="icon" size="xs" />
        </span>
      </slot>
      <span class="truncate">{{ label }}</span>
    </span>

    <slot name="trailing">
      <Badge v-if="count !== undefined" variant="neutral" size="sm" class="navigation-count">
        {{ count }}
      </Badge>
    </slot>
  </SelectableSurface>
</template>

<style scoped>
.navigation-item {
  transition:
    color 200ms ease-out,
    background-color 200ms ease-out,
    box-shadow 200ms ease-out;
}

.navigation-item:hover {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--navigation-item-accent) 7%, transparent);
}

.navigation-item[data-selected='true'] {
  color: color-mix(
    in srgb,
    var(--navigation-item-accent) 82%,
    var(--color-text-primary) 18%
  );
  background: color-mix(in srgb, var(--navigation-item-accent) 13%, transparent);
  box-shadow: var(--shadow-glass-xs);
}

.navigation-marker {
  position: absolute;
  inset-block: 0.45rem;
  left: 0;
  width: 0.1875rem;
  border-radius: var(--radius-pill);
  background: var(--navigation-item-accent);
  opacity: 0;
  transform: scaleY(0.55);
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}

.navigation-item[data-selected='true'] .navigation-marker {
  opacity: 1;
  transform: scaleY(1);
}

.navigation-icon {
  display: inline-flex;
  width: 1.35rem;
  height: 1.35rem;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--navigation-item-accent) 22%, transparent);
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--navigation-item-accent) 8%, transparent);
  color: color-mix(
    in srgb,
    var(--navigation-item-accent) 80%,
    var(--color-text-primary) 20%
  );
  transition: background-color 200ms ease-out, border-color 200ms ease-out;
}

.navigation-item[data-selected='true'] .navigation-icon {
  border-color: color-mix(in srgb, var(--navigation-item-accent) 42%, transparent);
  background: color-mix(in srgb, var(--navigation-item-accent) 16%, transparent);
}

.navigation-count {
  min-width: 1.65rem;
  flex: none;
  justify-content: center;
  border-color: var(--color-border-subtle);
  background: color-mix(in srgb, var(--color-bg-surface-hover) 35%, transparent);
  color: var(--color-text-muted);
  font-size: 0.58rem;
}

.navigation-item[data-selected='true'] .navigation-count {
  border-color: color-mix(in srgb, var(--navigation-item-accent) 32%, transparent);
  background: color-mix(in srgb, var(--navigation-item-accent) 11%, transparent);
  color: color-mix(
    in srgb,
    var(--navigation-item-accent) 74%,
    var(--color-text-primary) 26%
  );
}

@media (prefers-reduced-motion: reduce) {
  .navigation-item,
  .navigation-marker,
  .navigation-icon {
    transition: none;
  }
}
</style>
