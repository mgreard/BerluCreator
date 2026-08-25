<script setup lang="ts">
import { ref } from 'vue'
import Text from './Text.vue'
import type { TextProps, TextVariant, TextColor, TextWeight } from './types'

const variants: TextVariant[] = ['lead', 'body', 'body-sm', 'caption', 'overline', 'code']
const colors: TextColor[] = [
  'primary',
  'secondary',
  'muted',
  'inverse',
  'success',
  'warning',
  'danger',
  'info',
  'inherit'
]
const weights: TextWeight[] = ['normal', 'medium', 'semibold', 'bold']

const state = ref<TextProps>({
  variant: 'body',
  color: 'secondary',
  weight: 'normal',
  truncate: false
})
</script>

<template>
  <Story title="Primitives/Text" :layout="{ type: 'grid', width: '320px' }">
    <Variant v-for="v in variants" :key="v" :title="`Variant: ${v}`">
      <div class="p-4 bg-bg-surface border border-border-default rounded-xl">
        <Text :variant="v">{{ `Texte formaté en ${v}` }}</Text>
      </div>
    </Variant>

    <Variant v-for="c in colors" :key="c" :title="`Color: ${c}`">
      <div class="p-4 bg-bg-surface border border-border-default rounded-xl">
        <Text variant="body" :color="c">{{ `Texte couleur ${c}` }}</Text>
      </div>
    </Variant>

    <Variant title="Interactive Playground">
      <template #default>
        <div class="p-6 bg-bg-surface border border-border-default rounded-xl">
          <Text v-bind="state">
            Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en
            page avant impression.
          </Text>
        </div>
      </template>
      <template #controls>
        <HstSelect v-model="state.variant" title="Variant" :options="variants" />
        <HstSelect v-model="state.color" title="Color" :options="colors" />
        <HstSelect v-model="state.weight" title="Weight" :options="weights" />
        <HstCheckbox v-model="state.truncate" title="Truncate" />
      </template>
    </Variant>
  </Story>
</template>
