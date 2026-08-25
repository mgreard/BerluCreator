<script setup lang="ts">
import ButtonGroup from './ButtonGroup.vue'
import Button from '../button/Button.vue'
import Icon from '../icon/Icon.vue'
</script>

<template>
  <Story title="Buttons/ButtonGroup" :layout="{ type: 'grid', width: '100%' }">
    <Variant title="Attached Horizontal">
      <ButtonGroup>
        <Button variant="secondary" size="sm">
          <Icon name="expand_less" size="xs" /> Déplier
        </Button>
        <Button variant="secondary" size="sm">
          <Icon name="expand_more" size="xs" /> Replier
        </Button>
      </ButtonGroup>
    </Variant>

    <Variant title="Exports Group">
      <ButtonGroup>
        <Button variant="secondary" size="sm">
          <Icon name="format_indent_increase" size="xs" /> JSON
        </Button>
        <Button variant="secondary" size="sm">
          <Icon name="auto_awesome" size="xs" /> SVG
        </Button>
      </ButtonGroup>
    </Variant>
  </Story>
</template>
