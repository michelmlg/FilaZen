<script setup lang="ts">
import { DropdownMenuItem, useForwardProps } from 'radix-vue'
import { type HTMLAttributes } from 'vue'

const props = defineProps<{
  value?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
  textValue?: string
}>()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <DropdownMenuItem
    v-bind="forwardedProps"
    :class="[
      'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      props.class
    ]"
  >
    <slot />
  </DropdownMenuItem>
</template>
