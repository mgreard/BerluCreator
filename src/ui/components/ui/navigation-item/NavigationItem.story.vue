<script setup lang="ts">
import { ref } from 'vue'
import NavigationItem from './NavigationItem.vue'
import type { NavigationItemDensity } from './types'

const densities: NavigationItemDensity[] = ['default', 'compact']
const selectedCategory = ref('head')
const label = ref('Têtes')
const icon = ref('face')
const count = ref('7')
const accent = ref('#fb7185')
const density = ref<NavigationItemDensity>('default')
const selected = ref(true)
</script>

<template>
  <Story title="Navigation/NavigationItem" :layout="{ type: 'grid', width: '320px' }">
    <Variant title="Liste de catégories">
      <div class="grid gap-1 rounded-xl border border-border-default bg-bg-surface p-2">
        <NavigationItem
          label="Tous les sprites"
          icon="apps"
          :count="71"
          accent="#a78bfa"
          :selected="selectedCategory === 'all'"
          @click="selectedCategory = 'all'"
        />
        <NavigationItem
          label="Têtes"
          icon="face"
          :count="7"
          accent="#fb7185"
          :selected="selectedCategory === 'head'"
          @click="selectedCategory = 'head'"
        />
        <NavigationItem
          label="Bureaux"
          icon="desk"
          :count="3"
          accent="#a1a1aa"
          :selected="selectedCategory === 'desk'"
          @click="selectedCategory = 'desk'"
        />
      </div>
    </Variant>

    <Variant title="Densité compacte">
      <div class="grid gap-1 rounded-xl border border-border-default bg-bg-surface p-2">
        <NavigationItem label="Corps" icon="body_system" :count="1" density="compact" accent="#f59e0b" />
        <NavigationItem label="Yeux" icon="visibility" :count="4" density="compact" accent="#22d3ee" selected />
        <NavigationItem label="Bouches" icon="mood" :count="7" density="compact" accent="#fb7185" />
      </div>
    </Variant>

    <Variant title="Playground">
      <template #default>
        <div class="rounded-xl border border-border-default bg-bg-surface p-2">
          <NavigationItem
            :label="label"
            :icon="icon"
            :count="count"
            :accent="accent"
            :density="density"
            :selected="selected"
          />
        </div>
      </template>
      <template #controls>
        <HstText v-model="label" title="Libellé" />
        <HstText v-model="icon" title="Icône" />
        <HstText v-model="count" title="Compteur" />
        <HstText v-model="accent" title="Accent" />
        <HstSelect v-model="density" title="Densité" :options="densities" />
        <HstCheckbox v-model="selected" title="Sélectionné" />
      </template>
    </Variant>
  </Story>
</template>
