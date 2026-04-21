<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { TabsRoot, useForwardProps } from 'radix-vue'

const props = defineProps<{
  modelValue?: string
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const forwardedProps = useForwardProps({
  modelValue: props.modelValue,
  'onUpdate:modelValue': (val: string) => emit('update:modelValue', val),
})
</script>

<template>
  <TabsRoot v-bind="forwardedProps">
    <slot />
  </TabsRoot>
</template>
