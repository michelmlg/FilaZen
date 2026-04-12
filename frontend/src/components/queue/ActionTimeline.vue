<script setup lang="ts">
import type { QueueAction } from '@/stores/queue.store'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'

defineProps<{
  actions: QueueAction[]
  page: number
  totalPages: number
  total: number
}>()

const emit = defineEmits<{
  pageChange: [page: number]
}>()

const getActionConfig = (actionType: QueueAction['actionType']) => {
  switch (actionType) {
    case 'JOIN':
      return { icon: '➕', label: 'entrou na fila', bgClass: 'bg-success/10', textClass: 'text-success' }
    case 'LEAVE':
      return { icon: '↩️', label: 'saiu da fila', bgClass: 'bg-muted', textClass: 'text-muted-foreground' }
    case 'SKIP':
      return { icon: '⏭️', label: 'foi pulado', bgClass: 'bg-warning/10', textClass: 'text-warning' }
    case 'OPEN_TICKET':
      return { icon: '🎫', label: 'abriu ticket', bgClass: 'bg-primary/10', textClass: 'text-primary' }
    case 'COMPLETE_TICKET':
      return { icon: '✅', label: 'completou ticket', bgClass: 'bg-success/10', textClass: 'text-success' }
    case 'LOCK':
      return { icon: '🔒', label: 'travou a fila', bgClass: 'bg-destructive/10', textClass: 'text-destructive' }
    case 'UNLOCK':
      return { icon: '🔓', label: 'destravou a fila', bgClass: 'bg-success/10', textClass: 'text-success' }
    default:
      return { icon: '📋', label: 'ação desconhecida', bgClass: 'bg-muted', textClass: 'text-muted-foreground' }
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="font-semibold">Histórico de Ações</h3>
      <span class="text-sm text-muted-foreground">
        {{ total }} ações • Pág. {{ page }}/{{ totalPages || 1 }}
      </span>
    </div>

    <div v-if="actions.length === 0" class="text-center py-8 text-muted-foreground">
      Nenhuma ação registrada neste dia.
    </div>

    <div v-else class="space-y-1 max-h-80 overflow-y-auto">
      <div 
        v-for="action in actions" 
        :key="action.id"
        class="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/50"
      >
        <span 
          class="text-lg shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          :class="getActionConfig(action.actionType).bgClass"
        >
          <span :class="getActionConfig(action.actionType).textClass">{{ getActionConfig(action.actionType).icon }}</span>
        </span>
        <div class="flex-1 min-w-0">
          <span class="text-sm">
            <span class="font-medium text-foreground">{{ action.userName }}</span>
            <span class="text-muted-foreground"> {{ getActionConfig(action.actionType).label }}</span>
            <span v-if="action.position" class="text-muted-foreground"> (#{{ action.position }})</span>
          </span>
        </div>
        <span class="text-xs text-muted-foreground shrink-0">
          {{ formatTime(action.timestamp) }}
        </span>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-4 border-t">
      <Button 
        variant="outline" 
        size="sm"
        :disabled="page <= 1"
        @click="emit('pageChange', page - 1)"
      >
        <ChevronLeftIcon class="h-4 w-4 mr-1" />
        Anterior
      </Button>
      
      <span class="text-sm text-muted-foreground px-4">
        {{ page }} / {{ totalPages }}
      </span>
      
      <Button 
        variant="outline" 
        size="sm"
        :disabled="page >= totalPages"
        @click="emit('pageChange', page + 1)"
      >
        Próxima
        <ChevronRightIcon class="h-4 w-4 ml-1" />
      </Button>
    </div>
  </div>
</template>
