<script setup lang="ts">
import { computed } from 'vue'
import { useQueueStore } from '@/stores/queue.store'
import type { UserInQueue } from '@/stores/queue.store'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ClockIcon, CrownIcon, CoffeeIcon } from 'lucide-vue-next'

const props = defineProps<{
  user: UserInQueue
  position: number
  isCurrentUser: boolean
  highlight?: boolean
  showCrown?: boolean
}>()

const queue = useQueueStore()
const usePrimaryCrown = computed(() => queue.settings?.usePrimaryColorForCrown ?? false)

const waitTime = computed(() => {
  if (!props.user.queueEnteredAt) return '-'
  const entered = new Date(props.user.queueEnteredAt)
  const now = new Date()
  const diff = Math.floor((now.getTime() - entered.getTime()) / 60000)
  if (diff < 1) return 'Agora'
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h ${diff % 60}m`
})

const statusColor = computed(() => {
  return props.user.status?.color || '#6b7280'
})
</script>

<template>
  <div 
    class="queue-card group relative flex items-center gap-4 p-4 rounded-lg border bg-background hover:bg-accent transition-all duration-200"
    :class="{ 
      'ring-2 ring-muted-foreground/30': isCurrentUser,
      'ring-1 ring-muted-foreground/40 bg-muted/50': highlight,
      'opacity-60': user.wasSkipped 
    }"
  >
    <div 
      v-if="showCrown" 
      class="absolute -top-2 left-4 rounded-full p-1 shadow-sm z-10 ring-2 ring-background"
:class="usePrimaryCrown 
          ? 'bg-tenant-primary text-tenant-primary-foreground' 
          : 'bg-yellow-400 text-yellow-900'"
    >
      <CrownIcon class="h-4 w-4" />
    </div>

    <div 
      class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
      :class="position <= 3 ? 'bg-muted text-muted-foreground' : 'bg-muted/50 text-muted-foreground'"
    >
      {{ position }}
    </div>

    <div class="relative">
      <Avatar 
        :src="user.avatarUrl" 
        :fallback="user.name" 
        class="flex-shrink-0"
        :class="{ 'ring-2 ring-tenant-primary/40': showCrown && usePrimaryCrown }"
      />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-medium text-foreground truncate" :class="{ 'font-semibold': showCrown }">
          {{ user.name }}
        </span>
        <span 
          v-if="isCurrentUser" 
          class="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
        >
          Você
        </span>
        <span 
          v-if="user.wasSkipped" 
          class="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full flex-shrink-0"
        >
          Pulado
        </span>
        <span 
          v-if="user.isIdle" 
          class="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1"
        >
          <CoffeeIcon class="h-3 w-3" />
          Ausente
        </span>
      </div>
      <div class="flex items-center gap-3 text-sm text-muted-foreground mt-1">
        <span class="flex items-center gap-1">
          <ClockIcon class="h-3 w-3" />
          {{ waitTime }}
        </span>
        <Badge 
          v-if="user.status" 
          variant="secondary"
          class="text-xs"
          :style="{ backgroundColor: statusColor + '15', color: statusColor }"
        >
          {{ user.status.name }}
        </Badge>
      </div>
    </div>

    <div 
      v-if="position === 1 && !isCurrentUser && !showCrown" 
      class="flex-shrink-0 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full font-medium"
    >
      PRÓXIMO
    </div>
  </div>
</template>

<style scoped>
.queue-card {
  transform: translateX(0);
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.queue-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.queue-card:active {
  transform: scale(0.99);
}

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.highlight {
  animation: highlightPulse 1.5s ease-in-out;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
  50% {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
  }
}
</style>
