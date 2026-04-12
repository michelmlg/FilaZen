<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useQueueStore } from '@/stores/queue.store'
import { useToast } from '@/composables/useToast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'

const queue = useQueueStore()
const toast = useToast()

const loading = ref(false)

const formData = ref({
  strategy: 'FIFO' as 'FIFO' | 'PERFORMANCE' | 'HYBRID',
  businessHoursEnabled: true,
  businessHoursStart: '08:00',
  businessHoursEnd: '18:00',
  timezone: 'America/Sao_Paulo',
  maxQueueSize: 50,
  autoSnapshot: true,
  clearOnStart: false,
  locked: false,
  showAllInQueue: false,
  usePrimaryColorForCrown: false,
  idleBehavior: 'maintain_position' as 'maintain_position' | 'remove',
  idleTimeout: 5,
  idleTimeoutUnit: 'minutes' as 'minutes' | 'hours',
})

const timezones = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Recife', label: 'Recife (GMT-3)' },
  { value: 'America/Rio_Branco', label: 'Rio Branco (GMT-5)' },
  { value: 'America/New_York', label: 'Nova York (GMT-5)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
]

onMounted(async () => {
  await queue.fetchQueueConfig()
  if (queue.settings) {
    formData.value = {
      strategy: queue.settings.strategy || 'FIFO',
      businessHoursEnabled: queue.settings.businessHoursEnabled ?? true,
      businessHoursStart: queue.settings.businessHoursStart || '08:00',
      businessHoursEnd: queue.settings.businessHoursEnd || '18:00',
      timezone: queue.settings.timezone || 'America/Sao_Paulo',
      maxQueueSize: queue.settings.maxQueueSize || 50,
      autoSnapshot: queue.settings.autoSnapshot ?? true,
      clearOnStart: queue.settings.clearOnStart ?? false,
      locked: queue.settings.locked ?? false,
      showAllInQueue: queue.settings.showAllInQueue ?? false,
      usePrimaryColorForCrown: queue.settings.usePrimaryColorForCrown ?? false,
      idleBehavior: queue.settings.idleBehavior || 'maintain_position',
      idleTimeout: queue.settings.idleTimeout ?? 5,
      idleTimeoutUnit: queue.settings.idleTimeoutUnit || 'minutes',
    }
  }
})

const handleSave = async () => {
  loading.value = true
  try {
    const success = await queue.updateQueueConfig(formData.value)
    if (success) {
      toast.success('Configurações salvas!')
    } else {
      toast.error('Erro', queue.error || 'Não foi possível salvar.')
    }
  } catch {
    toast.error('Erro', 'Não foi possível salvar as configurações.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Estratégia de Ordenação</h2>
      <div class="grid gap-2">
        <Label for="strategy">Método de ordenação da fila</Label>
        <Select v-model="formData.strategy">
          <SelectItem value="FIFO">FIFO (First In, First Out) - Ordem de chegada</SelectItem>
          <SelectItem value="PERFORMANCE">Por Performance - Baseado no desempenho</SelectItem>
          <SelectItem value="HYBRID">Híbrido - Combinação de FIFO e Performance</SelectItem>
        </Select>
      </div>
    </div>

    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Horário de Funcionamento</h2>
      <div class="flex items-center gap-3 mb-4">
        <input 
          id="businessHoursEnabled" 
          v-model="formData.businessHoursEnabled" 
          type="checkbox"
          class="h-4 w-4 rounded border-input"
        />
        <Label for="businessHoursEnabled" class="font-medium cursor-pointer">
          Ativar controle de horário comercial
        </Label>
      </div>
      <div v-if="formData.businessHoursEnabled" class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="start">Início</Label>
          <Input 
            id="start" 
            v-model="formData.businessHoursStart" 
            type="time"
            placeholder="08:00"
          />
        </div>
        <div class="grid gap-2">
          <Label for="end">Fim</Label>
          <Input 
            id="end" 
            v-model="formData.businessHoursEnd" 
            type="time"
            placeholder="18:00"
          />
        </div>
      </div>
      <p v-if="formData.businessHoursEnabled" class="text-xs text-muted-foreground mt-2">
        Exemplo: 23:40 - 03:00 funciona das 23:40 às 03:00 (atravessa a meia-noite)
      </p>
    </div>

    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Timezone</h2>
      <div class="grid gap-2">
        <Label for="timezone">Fuso horário</Label>
        <Select v-model="formData.timezone">
          <SelectItem v-for="tz in timezones" :key="tz.value" :value="tz.value">
            {{ tz.label }}
          </SelectItem>
        </Select>
      </div>
    </div>

    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Configurações Gerais</h2>
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="maxSize">Limite da Fila</Label>
          <Input 
            id="maxSize" 
            v-model.number="formData.maxQueueSize" 
            type="number"
            min="1"
            max="100"
            placeholder="50"
          />
          <p class="text-xs text-muted-foreground">
            Número máximo de vendedores na fila
          </p>
        </div>

        <div class="flex items-center gap-3">
          <input 
            id="autoSnapshot" 
            v-model="formData.autoSnapshot" 
            type="checkbox"
            class="h-4 w-4 rounded border-input"
          />
          <div>
            <Label for="autoSnapshot" class="font-medium cursor-pointer">
              Gerar snapshot automático ao fechar
            </Label>
            <p class="text-xs text-muted-foreground">
              Cria um registro do estado da fila no horário de fechamento
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input 
            id="clearOnStart" 
            v-model="formData.clearOnStart" 
            type="checkbox"
            class="h-4 w-4 rounded border-input"
          />
          <div>
            <Label for="clearOnStart" class="font-medium cursor-pointer">
              Limpar fila ao iniciar
            </Label>
            <p class="text-xs text-muted-foreground">
              Zera a fila quando o horário de abertura é atingido
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input 
            id="locked" 
            v-model="formData.locked" 
            type="checkbox"
            class="h-4 w-4 rounded border-input"
          />
          <div>
            <Label for="locked" class="font-medium cursor-pointer">
              Travar fila manualmente
            </Label>
            <p class="text-xs text-muted-foreground">
              Impede que novos vendedores entrem na fila
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input 
            id="showAllInQueue" 
            v-model="formData.showAllInQueue" 
            type="checkbox"
            class="h-4 w-4 rounded border-input"
          />
          <div>
            <Label for="showAllInQueue" class="font-medium cursor-pointer">
              Exibir todos os vendedores da fila
            </Label>
            <p class="text-xs text-muted-foreground">
              Mostra todos os vendedores e suas posições na fila para todos os usuários, com animações de reorganização
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <input 
            id="usePrimaryColorForCrown" 
            v-model="formData.usePrimaryColorForCrown" 
            type="checkbox"
            class="h-4 w-4 rounded border-input"
          />
          <div>
            <Label for="usePrimaryColorForCrown" class="font-medium cursor-pointer">
              Usar cor primária na coroa do primeiro da fila
            </Label>
            <p class="text-xs text-muted-foreground">
              Quando ativado, a coroa usa a cor primária do tenant ao invés do amarelo
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-card rounded-lg border p-6">
      <h2 class="text-lg font-semibold mb-4">Comportamento when Idle</h2>
      <div class="grid gap-6">
        <div class="grid gap-2">
          <Label for="idleBehavior">Comportamento quando o usuário ficar inativo</Label>
          <Select v-model="formData.idleBehavior">
            <SelectItem value="maintain_position">
              Manter posição (volta ao topo quando retornar)
            </SelectItem>
            <SelectItem value="remove">
              Remover automaticamente da fila
            </SelectItem>
          </Select>
          <p class="text-xs text-muted-foreground">
            Usuário é considerado inativo quando fecha o navegador ou perde a conexão
          </p>
        </div>

        <div class="grid gap-2">
          <Label for="idleTimeout">Tempo para considerar inativo</Label>
          <div class="flex gap-2">
            <Input 
              id="idleTimeout" 
              v-model.number="formData.idleTimeout" 
              type="number"
              min="1"
              max="24"
              class="w-20"
            />
            <Select v-model="formData.idleTimeoutUnit" class="w-32">
              <SelectItem value="minutes">Minutos</SelectItem>
              <SelectItem value="hours">Horas</SelectItem>
            </Select>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <Button @click="handleSave" :disabled="loading">
        {{ loading ? 'Salvando...' : 'Salvar Configurações' }}
      </Button>
    </div>
  </div>
</template>
