<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQueueStore } from '@/stores/queue.store'
import { useToast } from '@/composables/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import SnapshotCard from '@/components/queue/SnapshotCard.vue'
import SnapshotDetail from '@/components/queue/SnapshotDetail.vue'

const queue = useQueueStore()
const toast = useToast()

const periodFilter = ref('30')
const customStartDate = ref('')
const customEndDate = ref('')
const selectedSnapshotDate = ref<string | null>(null)

onMounted(async () => {
  await queue.fetchSnapshots()
})

const handleFilterChange = async () => {
  if (periodFilter.value === 'custom' && customStartDate.value && customEndDate.value) {
    await queue.fetchSnapshotsByRange(customStartDate.value, customEndDate.value)
  } else if (periodFilter.value !== 'custom') {
    const days = parseInt(periodFilter.value)
    await queue.fetchSnapshots(days)
  }
}

const handleGenerateSnapshot = async () => {
  const success = await queue.generateSnapshot()
  if (success) {
    toast.success('Snapshot gerado com sucesso!')
  } else {
    toast.error('Erro', queue.snapshotsError || 'Não foi possível gerar snapshot.')
  }
}

const handleSnapshotClick = (date: string) => {
  selectedSnapshotDate.value = date
}

const handleCloseDetail = () => {
  selectedSnapshotDate.value = null
}

const formatPeriodLabel = (days: string) => {
  switch (days) {
    case '7': return 'Últimos 7 dias'
    case '30': return 'Últimos 30 dias'
    case '90': return 'Últimos 90 dias'
    default: return 'Personalizado'
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <Label for="period" class="whitespace-nowrap">Período:</Label>
          <Select v-model="periodFilter" @update:model-value="handleFilterChange">
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </Select>
        </div>

        <template v-if="periodFilter === 'custom'">
          <div class="flex items-center gap-2">
            <Input 
              v-model="customStartDate" 
              type="date" 
              class="w-40"
              @change="handleFilterChange"
            />
            <span class="text-muted-foreground">até</span>
            <Input 
              v-model="customEndDate" 
              type="date" 
              class="w-40"
              @change="handleFilterChange"
            />
          </div>
        </template>
      </div>

      <Button @click="handleGenerateSnapshot" :disabled="queue.loadingSnapshots">
        {{ queue.loadingSnapshots ? 'Gerando...' : 'Gerar Snapshot Agora' }}
      </Button>
    </div>

    <div v-if="queue.loadingSnapshots && queue.snapshots.length === 0" class="text-center py-12">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p class="text-muted-foreground">Carregando snapshots...</p>
    </div>

    <div v-else-if="queue.snapshots.length === 0" class="text-center py-12">
      <div class="text-4xl mb-4">📊</div>
      <h3 class="text-lg font-medium mb-2">Nenhum snapshot encontrado</h3>
      <p class="text-muted-foreground mb-4">
        Os snapshots são gerados automaticamente ao fechar a fila ou manualmente.
      </p>
      <Button @click="handleGenerateSnapshot">
        Gerar Primeiro Snapshot
      </Button>
    </div>

    <div v-else class="space-y-4">
      <div v-if="queue.snapshotsError" class="bg-destructive/10 text-destructive px-4 py-2 rounded-md">
        {{ queue.snapshotsError }}
      </div>

      <SnapshotCard
        v-for="snapshot in queue.snapshots"
        :key="snapshot.id"
        :snapshot="snapshot"
        @click="handleSnapshotClick(snapshot.snapshotDate)"
      />

      <div v-if="queue.snapshots.length > 0" class="text-center text-sm text-muted-foreground pt-4">
        Mostrando {{ queue.snapshots.length }} snapshots
      </div>
    </div>

    <SnapshotDetail
      v-if="selectedSnapshotDate"
      :date="selectedSnapshotDate"
      @close="handleCloseDetail"
    />
  </div>
</template>
