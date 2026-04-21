<script setup lang="ts">
import type { SnapshotData } from '@/stores/queue.store'
import { CalendarIcon, ClockIcon, UsersIcon, TimerIcon } from 'lucide-vue-next'

const props = defineProps<{
  snapshot: SnapshotData
}>()

const emit = defineEmits<{
  click: []
}>()

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatStrategy = (strategy: string) => {
  switch (strategy) {
    case 'FIFO': return 'FIFO'
    case 'PERFORMANCE': return 'Performance'
    case 'HYBRID': return 'Híbrido'
    default: return strategy
  }
}
</script>

<template>
  <div 
    class="bg-card rounded-lg border p-4 hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
    @click="emit('click')"
  >
    <div class="flex items-start justify-between">
      <div class="flex items-start gap-3">
        <div class="bg-primary/10 p-2 rounded-lg">
          <CalendarIcon class="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 class="font-semibold capitalize">
            {{ formatDate(snapshot.snapshotDate) }}
          </h3>
          <div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span class="flex items-center gap-1">
              <ClockIcon class="h-3.5 w-3.5" />
              {{ formatTime(snapshot.createdAt) }}
            </span>
            <span class="flex items-center gap-1">
              <UsersIcon class="h-3.5 w-3.5" />
              {{ snapshot.metadata.totalInQueue }} vendedores
            </span>
            <span v-if="snapshot.metadata.avgWaitTimeMinutes > 0" class="flex items-center gap-1">
              <TimerIcon class="h-3.5 w-3.5" />
              {{ snapshot.metadata.avgWaitTimeMinutes }}min espera
            </span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="text-xs bg-muted px-2 py-1 rounded">
          {{ formatStrategy(snapshot.strategy) }}
        </span>
        <span class="text-xs text-muted-foreground">
          Expandir ▼
        </span>
      </div>
    </div>

    <div v-if="snapshot.queueData.length > 0" class="mt-4 border-t pt-4">
      <p class="text-sm font-medium mb-2 text-muted-foreground">Top 3 da fila:</p>
      <div class="flex gap-2">
        <div 
          v-for="(user, index) in snapshot.queueData.slice(0, 3)" 
          :key="user.userId"
          class="flex items-center gap-2 text-sm"
        >
          <span class="font-bold" :class="{ 'text-primary': index === 0 }">
            #{{ user.position }}
          </span>
          <span>{{ user.name }}</span>
          <span class="text-muted-foreground">
            ({{ user.totalTicketsToday }} tickets)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
