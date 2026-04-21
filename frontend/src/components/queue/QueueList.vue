<script setup lang="ts">
import { computed } from 'vue'
import type { UserInQueue } from '@/stores/queue.store'
import { UsersIcon } from 'lucide-vue-next'
import QueueCard from './QueueCard.vue'

const props = defineProps<{
  users: UserInQueue[]
  currentUserId?: string
  showAll?: boolean
  maxHeight?: string
}>()

const sortedUsers = computed(() => 
  [...props.users].sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))
)

const displayedUsers = computed(() => {
  if (props.showAll) {
    return sortedUsers.value
  }
  return sortedUsers.value.filter((_, index) => index > 0)
})

const firstUserPosition = computed(() => {
  if (props.showAll) {
    return 1
  }
  return 2
})

const hasScrollableContent = computed(() => props.maxHeight && props.users.length > 0)
</script>

<template>
  <div 
    class="queue-list-container h-full"
    :class="{ 'has-scroll': hasScrollableContent }"
    :style="{ maxHeight: maxHeight }"
  >
    <div class="queue-list space-y-2 p-3" :class="{ 'show-all-mode': showAll }">
      <TransitionGroup name="queue-list" tag="div" class="space-y-2 relative">
        <QueueCard
          v-for="(user, index) in displayedUsers"
          :key="user.id"
          :user="user"
          :position="(user.queuePosition || firstUserPosition + index)"
          :is-current-user="user.id === currentUserId"
          :highlight="showAll && user.queuePosition === 1"
          :show-crown="showAll && user.queuePosition === 1"
        />
      </TransitionGroup>

      <div 
        v-if="users.length === 0" 
        class="text-center py-12 text-neutral-400"
      >
        <UsersIcon class="w-12 h-12 mx-auto mb-4 text-neutral-300" />
        <p class="font-medium">Nenhum vendedor na fila</p>
        <p class="text-sm mt-1">Aguarde alguém entrar ou entre na fila</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.queue-list-container {
  overflow-y: auto;
  scroll-behavior: smooth;
}

.queue-list-container.has-scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

.queue-list-container.has-scroll::-webkit-scrollbar {
  width: 4px;
}

.queue-list-container.has-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.queue-list-container.has-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.12);
  border-radius: 2px;
}

.queue-list-container.has-scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

.queue-list {
  position: relative;
}

.queue-list-move {
  transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), 
              opacity 0.3s ease-out;
  z-index: 1;
}

.queue-list-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

.queue-list-leave-active {
  transition: all 0.3s cubic-bezier(0.55, 0, 1, 0.45);
  position: absolute;
  z-index: 0;
  width: calc(100% - 1.5rem);
}

.queue-list-enter-from {
  opacity: 0;
  transform: translateY(-15px);
}

.queue-list-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.show-all-mode .queue-list-enter-active:nth-child(1) { 
  transition-delay: 0ms; 
  animation: crownBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.show-all-mode .queue-list-enter-active:nth-child(2) { transition-delay: 60ms; }
.show-all-mode .queue-list-enter-active:nth-child(3) { transition-delay: 90ms; }
.show-all-mode .queue-list-enter-active:nth-child(4) { transition-delay: 120ms; }
.show-all-mode .queue-list-enter-active:nth-child(5) { transition-delay: 150ms; }
.show-all-mode .queue-list-enter-active:nth-child(n+6) { transition-delay: 180ms; }

@keyframes crownBounce {
  0% {
    opacity: 0;
    transform: translateY(-20px) scale(0.9);
  }
  60% {
    transform: translateY(3px) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
