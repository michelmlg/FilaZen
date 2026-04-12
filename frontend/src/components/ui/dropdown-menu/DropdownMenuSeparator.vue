<script setup lang="ts">
import { DropdownMenuSeparator } from 'radix-vue'
import { type HTMLAttributes } from 'vue'

defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <DropdownMenuSeparator :class="['-mx-1 my-1 h-px bg-muted', $props.class]" />
</template>
