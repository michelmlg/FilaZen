<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQueueStore } from '@/stores/queue.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from '@/composables/useToast'
import { PlayIcon, SquareIcon, UsersIcon, SettingsIcon, CoffeeIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { TopCard, QueueList, QueueLocked } from '@/components/queue'
import QueueSummaryCard from '@/components/queue/QueueSummaryCard.vue'

const router = useRouter()
const queue = useQueueStore()
const auth = useAuthStore()
const toast = useToast()

onMounted(() => {
  queue.initialize()
})

onBeforeUnmount(() => {
  queue.cleanup()
})

const handleJoinQueue = async () => {
  const success = await queue.joinQueue()
  if (success) {
    toast.success('Você entrou na fila!', 'Aguarde sua vez para ser atendido.')
  } else {
    toast.error('Erro', queue.error || 'Não foi possível entrar na fila.')
  }
}

const handleLeaveQueue = async () => {
  const success = await queue.leaveQueue()
  if (success) {
    toast.info('Você saiu da fila')
  }
}

const showAllInQueue = computed(() => queue.settings?.showAllInQueue ?? false)

const topOfQueue = computed(() => queue.topOfQueue)

const displayedUsers = computed(() => {
  return queue.sortedQueue.filter(u => u.id !== topOfQueue.value?.id)
})

const totalInQueue = computed(() => queue.sortedQueue.length)

const isUserTopOfQueue = computed(() => queue.isUserTopOfQueue)

const rightSectionTitle = computed(() => {
  return showAllInQueue.value ? 'Fila Completa' : 'Resumo da Fila'
})

const idleUsersList = computed(() => queue.idleUsers)
</script>

<template>
  <div class="space-y-6 h-full flex flex-col">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Fila de Atendimento</h1>
        <p class="text-muted-foreground mt-1">
          {{ queue.isUserInQueue 
            ? `Você está na posição ${queue.currentUserPosition}` 
            : 'Entre na fila para ser atendido' 
          }}
        </p>
      </div>
      <div class="flex gap-3">
        <Button 
          v-if="auth.isManager"
          @click="router.push({ path: '/settings/queue', query: { backTo: '/' } })" 
          variant="outline"
          size="lg"
          title="Configurações da Fila"
        >
          <SettingsIcon class="h-5 w-5" />
        </Button>
        <Button 
          v-if="!queue.isUserInQueue" 
          @click="handleJoinQueue" 
          variant="tenant" 
          size="lg"
          :disabled="queue.isQueueLocked || queue.loading"
        >
          <PlayIcon class="h-5 w-5 mr-2" />
          Entrar na Fila
        </Button>
        <Button 
          v-else 
          @click="handleLeaveQueue" 
          variant="outline" 
          size="lg"
          :disabled="queue.loading"
        >
          <SquareIcon class="h-5 w-5 mr-2" />
          Sair da Fila
        </Button>
      </div>
    </div>

    <div v-if="queue.isQueueLocked" class="mb-6">
      <QueueLocked 
        :locked="queue.settings?.locked || false"
        :reason="queue.lockReason"
        :business-hours-start="queue.settings?.businessHoursStart"
        :business-hours-end="queue.settings?.businessHoursEnd"
        @retry="queue.fetchQueue"
      />
    </div>

    <div v-else class="flex-1 flex gap-6 min-h-0">
      <div class="w-1/2 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Próximo a atender
          </h2>
        </div>
        <div class="flex-1 rounded-xl border border-border bg-muted p-6 flex items-center justify-center">
          <div v-if="topOfQueue" class="w-full">
            <TopCard 
              :user="topOfQueue" 
              :is-current-user="topOfQueue.id === auth.user?.id"
            />
          </div>
          <div v-else class="text-center text-muted-foreground py-12">
            <UsersIcon class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p class="font-medium">Ninguém na fila</p>
            <p class="text-sm mt-1">Aguarde alguém entrar</p>
          </div>
        </div>
      </div>

      <div class="w-1/2 flex flex-col min-h-0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {{ rightSectionTitle }}
          </h2>
          <span class="text-sm text-muted-foreground">
            {{ totalInQueue }} vendedor{{ totalInQueue !== 1 ? 'es' : '' }}
          </span>
        </div>
        <div class="flex-1 rounded-xl border border-border bg-muted overflow-hidden">
          <template v-if="showAllInQueue">
            <QueueList 
              :users="displayedUsers"
              :current-user-id="auth.user?.id"
              :show-all="showAllInQueue"
              max-height="100%"
            />
          </template>
          <template v-else>
            <QueueSummaryCard 
              :total-in-queue="totalInQueue"
              :user-position="queue.currentUserPosition ?? undefined"
              :is-user-in-queue="queue.isUserInQueue"
              :is-user-top="isUserTopOfQueue"
            />
          </template>

          <div v-if="showAllInQueue && idleUsersList.length > 0" class="mt-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <CoffeeIcon class="h-4 w-4" />
                Ausentes
              </h2>
              <span class="text-sm text-muted-foreground">
                {{ idleUsersList.length }}
              </span>
            </div>
            <div class="rounded-lg border border-dashed border-border/50 bg-muted/30 p-3">
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="idleUser in idleUsersList"
                  :key="idleUser.id"
                  class="flex items-center gap-2 px-3 py-2 rounded-md bg-background border text-sm"
                >
                  <Avatar 
                    :src="idleUser.avatarUrl" 
                    :fallback="idleUser.name"
                    class="h-6 w-6"
                  />
                  <span class="text-muted-foreground">{{ idleUser.name }}</span>
                  <span class="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CoffeeIcon class="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
