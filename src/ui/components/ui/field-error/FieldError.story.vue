<script setup lang="ts">
import { ref } from 'vue'
import { FormGroup } from '@/components/ui/form-group'

const hasErr = ref(true)
</script>

<template>
  <Story title="Forms/FieldError" :layout="{ type: 'single' }">
    <Variant title="Messages d'erreur & Alertes ARIA">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup
          label="Erreur via prop string"
          label-for="invalid-email"
          error="Format d'email incorrect (ex: user@domain.com)"
          class="mb-0"
        >
          <input
            id="invalid-email"
            type="text"
            class="w-full bg-bg-surface/50 border border-danger rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
            value="invalide@"
          />
        </FormGroup>

        <FormGroup
          label="Erreur via slot par défaut"
          label-for="invalid-password"
          :error="hasErr"
          class="pt-4 border-t border-border-default mb-0"
        >
          <input
            id="invalid-password"
            type="password"
            class="w-full bg-bg-surface/50 border border-danger rounded-xl px-3 py-2 text-sm text-text-primary outline-none"
            value="123"
          />
          <template #error>
            <span>Le mot de passe doit comporter au moins <strong>8 caractères</strong>.</span>
          </template>
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
