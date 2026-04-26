<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { XIcon, CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, InfoIcon } from 'lucide-vue-next'

const { toasts, remove } = useToast()

const iconMap = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
}

const colorMap = {
  success: 'bg-success/10 border-success/30 text-success dark:bg-success/20 dark:border-success/50 dark:text-success',
  error: 'bg-destructive/10 border-destructive/30 text-destructive dark:bg-destructive/20 dark:border-destructive/50 dark:text-destructive',
  warning: 'bg-warning/10 border-warning/30 text-warning dark:bg-warning/20 dark:border-warning/50 dark:text-warning',
  info: 'bg-tenant-primary/10 border-tenant-primary/30 text-tenant-primary dark:bg-tenant-primary/20 dark:border-tenant-primary/50 dark:text-tenant-primary',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
            colorMap[toast.type]
          ]"
        >
          <component :is="iconMap[toast.type]" class="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-sm opacity-80 mt-0.5">{{ toast.message }}</p>
          </div>
          <button @click="remove(toast.id)" class="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity">
            <XIcon class="h-4 w-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  animation: slideIn 0.3s ease-out;
}
.toast-leave-active {
  animation: slideOut 0.2s ease-in;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
</style>
