<script setup lang="ts">
import PageHeader from './PageHeader.vue'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Story title="Layout/PageHeader" :layout="{ type: 'single' }">
    <Variant title="Standard Page Header">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-3xl mx-auto"
      >
        <PageHeader
          title="Gestion des Utilisateurs"
          subtitle="Consultez, filtrez et gérez les permissions des membres de votre organisation."
          section-title="Administration"
          icon="👥"
        >
          <template #actions>
            <Button variant="secondary" size="sm">Exporter CSV</Button>
            <Button variant="primary" size="sm">Inviter un membre</Button>
          </template>
        </PageHeader>
      </div>
    </Variant>
  </Story>
</template>
