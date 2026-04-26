<script setup lang="ts">
import { ref, watch } from 'vue'
import { useQueueStore } from '@/stores/queue.store'
import { Button } from '@/components/ui/button'
import { XIcon, UsersIcon, TimerIcon, TicketIcon } from 'lucide-vue-next'
import ActionTimeline from './ActionTimeline.vue'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  close: []
}>()

const queue = useQueueStore()
const currentPage = ref(1)

watch(() => props.date, async (newDate) => {
  if (newDate) {
    currentPage.value = 1
    await queue.fetchSnapshotDetail(newDate, 1)
  }
}, { immediate: true })

const handlePageChange = async (page: number) => {
  currentPage.value = page
  await queue.fetchSnapshotDetail(props.date, page)
}

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
    case 'FIFO': return 'FIFO (Ordem de Chegada)'
    case 'PERFORMANCE': return 'Por Performance'
    case 'HYBRID': return 'Híbrido'
    default: return strategy
  }
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div class="bg-background rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      <div class="flex items-center justify-between p-6 border-b">
        <div>
          <h2 class="text-xl font-bold capitalize">
            {{ queue.currentSnapshotDetail?.snapshot ? formatDate(queue.currentSnapshotDetail.snapshot.snapshotDate) : 'Carregando...' }}
          </h2>
          <p v-if="queue.currentSnapshotDetail?.snapshot" class="text-sm text-muted-foreground">
            {{ formatTime(queue.currentSnapshotDetail.snapshot.createdAt) }} • {{ formatStrategy(queue.currentSnapshotDetail.snapshot.strategy) }}
          </p>
        </div>
        <button 
          @click="emit('close')"
          class="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <XIcon class="h-5 w-5" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="queue.loadingSnapshots" class="flex items-center justify-center py-12">
          <div class="animate-spin h-8 w-8 border-4 border-tenant-primary border-t-transparent rounded-full"></div>
        </div>

        <template v-else-if="queue.currentSnapshotDetail">
          <div v-if="queue.currentSnapshotDetail.snapshot" class="space-y-6">
            <div class="bg-muted/50 rounded-lg p-4">
              <h3 class="font-semibold mb-3 flex items-center gap-2">
                <UsersIcon class="h-4 w-4" />
                Resumo às {{ formatTime(queue.currentSnapshotDetail.snapshot.createdAt) }}
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="text-2xl font-bold text-tenant-primary">
                    {{ queue.currentSnapshotDetail.snapshot.metadata.totalInQueue }}
                  </div>
                  <div class="text-xs text-muted-foreground">Na fila</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold">
                    {{ queue.currentSnapshotDetail.snapshot.queueData.reduce((sum, u) => sum + u.totalTicketsToday, 0) }}
                  </div>
                  <div class="text-xs text-muted-foreground">Tickets hoje</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold">
                    {{ queue.currentSnapshotDetail.snapshot.metadata.avgWaitTimeMinutes || '-' }}
                    <span v-if="queue.currentSnapshotDetail.snapshot.metadata.avgWaitTimeMinutes" class="text-sm">min</span>
                  </div>
                  <div class="text-xs text-muted-foreground">Espera média</div>
                </div>
              </div>
            </div>

            <div v-if="queue.currentSnapshotDetail.snapshot.queueData.length > 0">
              <h3 class="font-semibold mb-3 flex items-center gap-2">
                <TicketIcon class="h-4 w-4" />
                Posições na Fila
              </h3>
              <div class="space-y-2">
                <div 
                  v-for="user in queue.currentSnapshotDetail.snapshot.queueData" 
                  :key="user.userId"
                  class="flex items-center gap-3 p-3 bg-card rounded-lg border"
                >
                  <span 
                    class="font-bold text-lg w-8"
                    :class="user.position === 1 ? 'text-tenant-primary' : 'text-muted-foreground'"
                  >
                    #{{ user.position }}
                  </span>
                  <div class="flex-1">
                    <div class="font-medium">{{ user.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ user.status }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium">{{ user.totalTicketsToday }}</div>
                    <div class="text-xs text-muted-foreground">tickets</div>
                  </div>
                </div>
              </div>
            </div>

            <ActionTimeline
              :actions="queue.currentSnapshotDetail.actions.items"
              :page="queue.currentSnapshotDetail.actions.page"
              :total-pages="queue.currentSnapshotDetail.actions.totalPages"
              :total="queue.currentSnapshotDetail.actions.total"
              @page-change="handlePageChange"
            />
          </div>

          <div v-else class="text-center py-12">
            <p class="text-muted-foreground">Nenhum snapshot disponível para esta data.</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
