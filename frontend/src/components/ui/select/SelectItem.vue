<script setup lang="ts">
const props = defineProps<{
  value: string
  disabled?: boolean
}>()
</script>

<template>
  <option :value="value" :disabled="disabled">
    <slot />
  </option>
</template>
