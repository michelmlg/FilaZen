<script setup lang="ts">
import { computed } from 'vue'
import { LockIcon, ClockIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

interface LockReason {
  type: 'MANUAL' | 'BUSINESS_HOURS' | null
  message: string | null
}

const props = defineProps<{
  locked: boolean
  reason: LockReason | string | null
  businessHoursStart?: string
  businessHoursEnd?: string
}>()

const emit = defineEmits<{
  retry: []
}>()

const isManualLock = computed(() => {
  if (typeof props.reason === 'object' && props.reason?.type === 'MANUAL') return true
  if (typeof props.reason === 'string' && props.reason.includes('administrador')) return true
  return props.locked
})

const displayMessage = computed(() => {
  if (typeof props.reason === 'object' && props.reason) {
    return props.reason.message
  }
  return props.reason
})

const displayTime = computed(() => {
  if (props.businessHoursStart && props.businessHoursEnd) {
    return `${props.businessHoursStart} - ${props.businessHoursEnd}`
  }
  return null
})
</script>

<template>
  <div class="queue-locked-container">
    <div class="locked-card">
      <div class="locked-icon">
        <LockIcon class="h-12 w-12 text-muted-foreground" />
      </div>

      <h3 class="text-xl font-bold text-foreground mt-4">
        {{ isManualLock ? 'Fila Travada' : 'Fora do Horário' }}
      </h3>

      <p class="text-muted-foreground mt-2 text-center max-w-sm">
        {{ displayMessage || 'A fila de atendimento não está disponível no momento.' }}
      </p>

      <div 
        v-if="displayTime" 
        class="flex items-center gap-2 mt-4 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg"
      >
        <ClockIcon class="h-4 w-4" />
        <span>Horário de funcionamento: {{ displayTime }}</span>
      </div>

      <Button 
        variant="outline" 
        class="mt-6"
        @click="emit('retry')"
      >
        Tentar novamente
      </Button>
    </div>
  </div>
</template>

<style scoped>
.queue-locked-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;
}

.locked-card {
  text-align: center;
  max-width: 400px;
}

.locked-icon {
  display: inline-flex;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 50%;
}

.dark .locked-icon {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
}
</style>
