<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQueueStore } from '@/stores/queue.store'
import type { UserInQueue } from '@/stores/queue.store'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrownIcon, TicketIcon } from 'lucide-vue-next'

const props = defineProps<{
  user: UserInQueue
  isCurrentUser: boolean
}>()

const router = useRouter()
const queue = useQueueStore()

const usePrimaryCrown = computed(() => queue.settings?.usePrimaryColorForCrown ?? false)

const statusColor = computed(() => {
  return props.user.status?.color || '#6b7280'
})

const handleOpenTicket = () => {
  router.push('/tickets/create')
}
</script>

<template>
  <div 
    class="top-card relative w-full transition-all duration-300"
    :class="isCurrentUser ? 'bg-background' : 'bg-muted'"
  >
    <div 
      v-if="isCurrentUser" 
      class="glow-ring absolute inset-0 rounded-2xl pointer-events-none"
    />

    <div class="relative z-10 flex flex-col items-center text-center space-y-5 p-6">
      <div class="relative">
        <Avatar 
          :src="user.avatarUrl" 
          :fallback="user.name" 
          size="lg" 
          class="h-28 w-28 text-3xl ring-4 ring-background shadow-lg"
        />
        <div 
          class="absolute -top-2 -right-2 rounded-full p-2 shadow-lg z-10 ring-2 ring-background"
          :class="usePrimaryCrown 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-yellow-400 text-yellow-900'"
        >
          <CrownIcon class="h-5 w-5" />
        </div>
      </div>

      <div class="space-y-2">
        <h3 class="text-2xl font-semibold text-foreground">{{ user.name }}</h3>
        <Badge 
          v-if="user.status" 
          class="px-3 py-1 text-sm font-medium"
          :style="{ backgroundColor: statusColor + '15', color: statusColor }"
        >
          {{ user.status.name }}
        </Badge>
      </div>

      <div 
        v-if="isCurrentUser" 
        class="bg-muted text-foreground px-5 py-2 rounded-full font-semibold text-sm tracking-wide"
      >
        SUA VEZ
      </div>

      <Button 
        v-if="isCurrentUser && user.queuePosition === 1"
        size="lg" 
        class="w-full gap-2 text-base font-medium"
        @click="handleOpenTicket"
      >
        <TicketIcon class="h-5 w-5" />
        Abrir Ticket
      </Button>

      <p v-else class="text-sm text-muted-foreground">
        Aguardando atendimento...
      </p>
    </div>
  </div>
</template>

<style scoped>
.glow-ring {
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.02) 0%, transparent 70%);
  animation: pulse-glow 3s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.03);
  }
  50% {
    box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.06);
  }
}
</style>
