<script setup lang="ts">
defineProps<{
  placeholder?: string
}>()
</script>

<template>
  <span class="text-muted-foreground">
    <slot />
  </span>
</template>
