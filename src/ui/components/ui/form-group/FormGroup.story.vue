<script setup lang="ts">
import { ref } from 'vue'
import FormGroup from './FormGroup.vue'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const email = ref('')
const notifications = ref(true)
</script>

<template>
  <Story title="Forms/FormGroup" :layout="{ type: 'single' }">
    <Variant title="Form Groups (Vertical & Inline)">
      <div
        class="flex flex-col gap-6 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup
          label="Adresse Email"
          label-for="email-input"
          required
          helper-text="Nous ne partagerons jamais votre email."
          class="mb-0"
        >
          <Input id="email-input" v-model="email" placeholder="nom@exemple.com" />
        </FormGroup>

        <FormGroup
          label="Mot de passe"
          label-for="pwd-input"
          required
          error="Le mot de passe doit comporter au moins 8 caractères."
          class="mb-0"
        >
          <Input id="pwd-input" type="password" placeholder="••••••••" error />
        </FormGroup>

        <FormGroup
          label="Notifications push"
          label-for="notifications-switch"
          inline
          helper-text="Recevez les alertes en temps réel."
          class="pt-4 border-t border-border-default mb-0"
        >
          <Switch id="notifications-switch" v-model="notifications" />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
