<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { TabsContent } from 'radix-vue'

const props = defineProps<{
  value: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <TabsContent :value="props.value" :class="['mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2', props.class]">
    <slot />
  </TabsContent>
</template>
