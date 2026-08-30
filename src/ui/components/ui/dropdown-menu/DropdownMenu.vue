<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuArrow,
  useForwardPropsEmits,
  type DropdownMenuContentProps
} from 'reka-ui'
import { cva } from 'class-variance-authority'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/shared/utils/cn'
import type { DropdownMenuProps, DropdownMenuEmits, DropdownMenuItemDef } from './types'

defineOptions({ inheritAttrs: false })

const dropdownMenuVariants = cva(
  'z-50 min-w-[200px] overflow-hidden rounded-[var(--radius-md,12px)] border p-1.5 text-text-primary outline-none select-none',
  {
    variants: {
      surface: {
        solid: 'bg-bg-elevated border-border-default shadow-glass-lg',
        glass: 'glass-premium border-border-default shadow-glass-lg'
      },
      width: {
        auto: 'w-auto',
        sm: 'w-48',
        md: 'w-56',
        lg: 'w-64',
        trigger: 'w-[var(--reka-dropdown-menu-trigger-width)]'
      }
    },
    defaultVariants: {
      surface: 'solid',
      width: 'md'
    }
  }
)

const isOpen = defineModel<boolean>('open', { default: false })

const {
  items = [],
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  alignOffset = 0,
  width = 'md',
  surface = 'solid',
  modal = true,
  portal = true,
  portalTo = 'body',
  portalDefer = true,
  avoidCollisions = true,
  collisionBoundary = undefined,
  collisionPadding = 8,
  positionStrategy = 'fixed',
  sticky = 'partial',
  hideWhenDetached = true,
  updatePositionStrategy = 'optimized',
  arrow = false,
  disabled = false,
  class: className = undefined
} = defineProps<DropdownMenuProps>()

const emit = defineEmits<DropdownMenuEmits>()
const attrs = useAttrs()

const contentPositionProps = computed<DropdownMenuContentProps>(() => ({
  align,
  side,
  sideOffset,
  alignOffset,
  avoidCollisions,
  collisionBoundary,
  collisionPadding,
  positionStrategy,
  sticky,
  hideWhenDetached,
  updatePositionStrategy
}))
const forwardedContentProps = useForwardPropsEmits(contentPositionProps)
const forwardedContent = computed(() => ({ ...forwardedContentProps.value, ...attrs }))

const widthClass = computed(() => {
  if (width === 'auto') return 'w-auto'
  if (width === 'sm') return 'w-48'
  if (width === 'md') return 'w-56'
  if (width === 'lg') return 'w-64'
  if (width === 'trigger') return 'w-[var(--reka-dropdown-menu-trigger-width)]'
  return width || 'w-56'
})

const isStandardWidth = (w: string): w is 'auto' | 'sm' | 'md' | 'lg' | 'trigger' => {
  return ['auto', 'sm', 'md', 'lg', 'trigger'].includes(w)
}

const contentClasses = computed(() => {
  return cn(
    dropdownMenuVariants({ surface, width: isStandardWidth(width) ? width : undefined }),
    'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 duration-300 ease-out',
    widthClass.value,
    className
  )
})

function handleItemSelect(item: DropdownMenuItemDef) {
  if (item.disabled) return
  if (item.onClick) {
    item.onClick(item)
  }
  emit('select', item)
}

function handleCheckboxChange(item: DropdownMenuItemDef, checked: boolean) {
  handleItemSelect({ ...item, checked })
}
</script>

<template>
  <DropdownMenuRoot v-model:open="isOpen" :modal="modal">
    <DropdownMenuTrigger v-if="$slots.trigger" as-child :disabled="disabled">
      <slot name="trigger" :open="isOpen" />
    </DropdownMenuTrigger>

    <component
      :is="portal ? DropdownMenuPortal : 'template'"
      :to="portal ? portalTo : undefined"
      :defer="portal ? portalDefer : undefined"
    >
      <DropdownMenuContent
        v-bind="forwardedContent"
        :class="contentClasses"
        :data-surface="surface"
      >
        <!-- Slot d'en-tête personnalisé -->
        <slot name="header" />

        <!-- Rendu dynamique des éléments déclaratifs -->
        <slot>
          <template v-for="(item, index) in items" :key="item.id || index">
            <!-- 1. Séparateur -->
            <DropdownMenuSeparator
              v-if="item.type === 'separator'"
              class="h-px my-1 -mx-1 bg-border-default/60"
            />

            <!-- 2. Libellé / Label de section -->
            <DropdownMenuLabel
              v-else-if="item.type === 'label'"
              class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted select-none"
            >
              {{ item.label }}
            </DropdownMenuLabel>

            <!-- 3. Sous-Menu en Cascade -->
            <DropdownMenuSub v-else-if="item.children && item.children.length > 0">
              <DropdownMenuSubTrigger
                :disabled="item.disabled"
                :class="
                  cn(
                    'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm,8px)] px-2.5 py-2 text-xs font-medium outline-none transition-colors duration-300 ease-out',
                    'text-text-primary data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary data-[state=open]:bg-primary/15',
                    item.disabled && 'opacity-50 pointer-events-none'
                  )
                "
              >
                <Icon v-if="item.icon" :name="item.icon" size="sm" class="shrink-0" />
                <span class="flex-1 truncate text-left">{{ item.label }}</span>
                <Icon name="chevron_right" size="xs" class="text-text-muted ml-auto shrink-0" />
              </DropdownMenuSubTrigger>

              <DropdownMenuPortal :to="portalTo" :defer="portalDefer">
                <DropdownMenuSubContent
                  :class="
                    cn(
                      dropdownMenuVariants({ surface, width: 'md' }),
                      'animate-in fade-in-0 zoom-in-95 data-[side=right]:slide-in-from-left-2 data-[side=left]:slide-in-from-right-2 duration-300 ease-out shadow-glass-xl'
                    )
                  "
                  :data-surface="surface"
                  :side-offset="4"
                  :align-offset="-4"
                  :avoid-collisions="avoidCollisions"
                  :collision-boundary="collisionBoundary"
                  :collision-padding="collisionPadding"
                  :position-strategy="positionStrategy"
                  :sticky="sticky"
                  :hide-when-detached="hideWhenDetached"
                  :update-position-strategy="updatePositionStrategy"
                >
                  <template
                    v-for="(subItem, subIndex) in item.children"
                    :key="subItem.id || subIndex"
                  >
                    <DropdownMenuSeparator
                      v-if="subItem.type === 'separator'"
                      class="h-px my-1 -mx-1 bg-border-default/60"
                    />
                    <DropdownMenuItem
                      v-else
                      :disabled="subItem.disabled"
                      :class="
                        cn(
                          'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm,8px)] px-2.5 py-2 text-xs font-medium outline-none transition-colors duration-300 ease-out',
                          subItem.destructive
                            ? 'text-danger data-[highlighted]:bg-danger/15 data-[highlighted]:text-danger'
                            : 'text-text-primary data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary',
                          subItem.disabled && 'opacity-50 pointer-events-none'
                        )
                      "
                      @select="handleItemSelect(subItem)"
                    >
                      <Icon v-if="subItem.icon" :name="subItem.icon" size="sm" class="shrink-0" />
                      <span class="flex-1 truncate text-left">{{ subItem.label }}</span>
                      <span
                        v-if="subItem.shortcut"
                        class="ml-auto text-[10px] tracking-widest text-text-muted font-mono bg-bg-surface/80 px-1.5 py-0.5 rounded-md border border-border-subtle"
                      >
                        {{ subItem.shortcut }}
                      </span>
                    </DropdownMenuItem>
                  </template>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <!-- 4. Option Checkbox -->
            <DropdownMenuCheckboxItem
              v-else-if="item.type === 'checkbox'"
              :model-value="item.checked"
              :disabled="item.disabled"
              :class="
                cn(
                  'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm,8px)] px-2.5 py-2 text-xs font-medium outline-none transition-colors duration-300 ease-out',
                  'text-text-primary data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary',
                  item.disabled && 'opacity-50 pointer-events-none'
                )
              "
              @update:model-value="(val: boolean) => handleCheckboxChange(item, val)"
            >
              <DropdownMenuItemIndicator
                class="inline-flex items-center justify-center text-primary font-bold text-xs shrink-0 w-4"
              >
                <Icon name="check" size="xs" />
              </DropdownMenuItemIndicator>
              <span v-if="!item.checked" class="w-4 shrink-0" />
              <span class="flex-1 truncate text-left">{{ item.label }}</span>
              <span
                v-if="item.shortcut"
                class="ml-auto text-[10px] tracking-widest text-text-muted font-mono bg-bg-surface/80 px-1.5 py-0.5 rounded-md border border-border-subtle"
              >
                {{ item.shortcut }}
              </span>
            </DropdownMenuCheckboxItem>

            <!-- 5. Élément Standard / Destructif -->
            <DropdownMenuItem
              v-else
              :disabled="item.disabled"
              :class="
                cn(
                  'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-[var(--radius-sm,8px)] px-2.5 py-2 text-xs font-medium outline-none transition-colors duration-300 ease-out',
                  item.destructive
                    ? 'text-danger data-[highlighted]:bg-danger/15 data-[highlighted]:text-danger'
                    : 'text-text-primary data-[highlighted]:bg-primary/15 data-[highlighted]:text-primary',
                  item.disabled && 'opacity-50 pointer-events-none'
                )
              "
              @select="handleItemSelect(item)"
            >
              <slot name="item" :item="item">
                <Icon v-if="item.icon" :name="item.icon" size="sm" class="shrink-0" />
                <span class="flex-1 truncate text-left">{{ item.label }}</span>
                <span
                  v-if="item.shortcut"
                  class="ml-auto text-[10px] tracking-widest text-text-muted font-mono bg-bg-surface/80 px-1.5 py-0.5 rounded-md border border-border-subtle"
                >
                  {{ item.shortcut }}
                </span>
              </slot>
            </DropdownMenuItem>
          </template>
        </slot>

        <!-- Slot de pied personnalisé -->
        <slot name="footer" />

        <!-- Flèche optionnelle -->
        <DropdownMenuArrow
          v-if="arrow"
          :class="
            surface === 'glass'
              ? 'fill-bg-glass stroke-border-default'
              : 'fill-bg-elevated stroke-border-default'
          "
          :width="12"
          :height="6"
        />
      </DropdownMenuContent>
    </component>
  </DropdownMenuRoot>
</template>
