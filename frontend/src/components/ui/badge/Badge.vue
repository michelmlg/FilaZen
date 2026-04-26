<script setup lang="ts">
 

import { type HTMLAttributes, computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-success/20 text-success dark:bg-success/30 dark:text-success',
        warning: 'border-transparent bg-warning/20 text-warning dark:bg-warning/30 dark:text-warning',
        tenant: 'border-transparent bg-tenant-primary text-tenant-primary-foreground hover:bg-tenant-primary/80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps extends HTMLAttributes, /* @vue-ignore */ VariantProps<typeof badgeVariants> {}

const props = defineProps<BadgeProps>()

const classes = computed(() => cn(badgeVariants(props), props.class))
</script>

<template>
  <component :is="'span'" :class="classes">
    <slot />
  </component>
</template>
