<script setup lang="ts">
import { ref } from 'vue'
import OtpInput from './OtpInput.vue'
import { FormGroup } from '@/components/ui/form-group'
import type { OtpInputProps } from './types'

const code6 = ref('123456')
const code4 = ref('')
const securePin = ref('')

const state = ref<OtpInputProps>({
  length: 6,
  type: 'number',
  separator: true,
  variant: 'default',
  size: 'md',
  disabled: false
})
</script>

<template>
  <Story title="Forms/OtpInput" :layout="{ type: 'single' }">
    <Variant title="Standard & Secured OTP Inputs">
      <div
        class="flex flex-col gap-8 p-8 bg-bg-surface border border-border-default rounded-2xl max-w-md mx-auto"
      >
        <FormGroup label="Code à 6 Chiffres avec Séparateur" class="mb-0">
          <OtpInput v-model="code6" v-bind="state" />
          <template #helper>Code : {{ code6 }}</template>
        </FormGroup>

        <FormGroup
          label="Code PIN Masqué à 4 Chiffres (Password)"
          class="pt-4 border-t border-border-default mb-0"
        >
          <OtpInput v-model="securePin" :length="4" type="password" mask variant="glass" />
        </FormGroup>

        <FormGroup
          label="Variante Bordered (4 chiffres)"
          class="pt-4 border-t border-border-default mb-0"
        >
          <OtpInput v-model="code4" :length="4" variant="bordered" size="sm" />
        </FormGroup>
      </div>
    </Variant>
  </Story>
</template>
