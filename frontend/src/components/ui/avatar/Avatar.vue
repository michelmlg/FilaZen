<script setup lang="ts">
 

import { type HTMLAttributes, computed } from 'vue'

export interface AvatarProps {
  src?: string | null
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<AvatarProps>(), {
  size: 'md',
})

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const initials = computed(() => {
  if (props.fallback) return props.fallback.slice(0, 2).toUpperCase()
  return '??'
})
</script>

<template>
  <div
    :class="[
      'relative inline-flex items-center justify-center rounded-full bg-muted overflow-hidden font-medium',
      sizeClasses[size],
      props.class
    ]"
  >
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      class="aspect-square h-full w-full object-cover"
    />
    <span v-else>{{ initials }}</span>
  </div>
</template>
