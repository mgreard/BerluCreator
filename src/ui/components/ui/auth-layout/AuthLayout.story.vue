<script setup lang="ts">
import AuthLayout from './AuthLayout.vue'
import { FormGroup } from '@/components/ui/form-group'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Story title="Layout/AuthLayout" :layout="{ type: 'single' }">
    <Variant title="Login Screen Mockup">
      <div class="h-[600px] border border-border-default rounded-2xl overflow-hidden">
        <AuthLayout
          brand-title="MyCompLib Cloud"
          brand-icon="diamond"
          tagline="Accédez à l'ensemble de vos composants et design tokens"
        >
          <form class="space-y-4" @submit.prevent>
            <FormGroup label="Email" label-for="email" required>
              <Input id="email" type="email" placeholder="user@company.com" />
            </FormGroup>

            <FormGroup label="Mot de passe" label-for="password" required>
              <Input id="password" type="password" placeholder="••••••••" />
            </FormGroup>

            <Button variant="primary" class="w-full mt-2">Se connecter</Button>
          </form>

          <template #footer>
            <p>© 2026 MyCompLib UI. Tous droits réservés.</p>
          </template>
        </AuthLayout>
      </div>
    </Variant>
  </Story>
</template>
