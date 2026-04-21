<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTicketStore, type CreateTicketDto } from '@/stores/ticket.store'
import { useCustomerStore } from '@/stores/customer.store'
import { useToast } from '@/composables/useToast'
import { PlusIcon, SearchIcon, TicketIcon, CheckCircleIcon, ClockIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const ticketStore = useTicketStore()
const customerStore = useCustomerStore()
const toast = useToast()

const showCreateModal = ref(false)
const searchQuery = ref('')
const activeTab = ref('all')

const form = ref<CreateTicketDto>({
  title: '',
  description: '',
  customerId: '',
})

const filteredTickets = computed(() => {
  let tickets = ticketStore.tickets
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    tickets = tickets.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.customerName?.toLowerCase().includes(query)
    )
  }
  
  if (activeTab.value === 'open') {
    tickets = tickets.filter(t => t.status.name !== 'Fechado')
  } else if (activeTab.value === 'closed') {
    tickets = tickets.filter(t => t.status.name === 'Fechado')
  }
  
  return tickets
})

const statusIcons = {
  'Aberto': ClockIcon,
  'Em Progresso': TicketIcon,
  'Fechado': CheckCircleIcon,
}

onMounted(() => {
  ticketStore.fetchTickets()
  customerStore.fetchCustomers()
  ticketStore.setupWebSocket()
})

const handleCreateTicket = async () => {
  try {
    await ticketStore.createTicket(form.value)
    toast.success('Ticket criado!', 'Oportunidade registrada com sucesso.')
    showCreateModal.value = false
    form.value = { title: '', description: '', customerId: '' }
  } catch {
    toast.error('Erro', 'Não foi possível criar o ticket.')
  }
}

const handleAcceptTicket = async (id: string) => {
  try {
    await ticketStore.acceptTicket(id)
    toast.success('Ticket aceito!', 'Você assumiu essa oportunidade.')
  } catch {
    toast.error('Erro', 'Não foi possível aceitar o ticket.')
  }
}

const handleCloseTicket = async (id: string) => {
  try {
    await ticketStore.closeTicket(id)
    toast.success('Ticket fechado!', 'Oportunidade concluída.')
  } catch {
    toast.error('Erro', 'Não foi possível fechar o ticket.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Oportunidades</h1>
        <p class="text-muted-foreground mt-1">Gerencie tickets e oportunidades de venda</p>
      </div>
      <Button @click="showCreateModal = true">
        <PlusIcon class="h-5 w-5 mr-2" />
        Nova Oportunidade
      </Button>
    </div>

    <div class="flex gap-4 items-center">
      <div class="relative flex-1 max-w-md">
        <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="Buscar tickets..." class="pl-10" />
      </div>
    </div>

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger value="all">Todos</TabsTrigger>
        <TabsTrigger value="open">Abertos</TabsTrigger>
        <TabsTrigger value="closed">Fechados</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div class="grid gap-4">
          <div v-for="ticket in filteredTickets" :key="ticket.id" class="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <component :is="statusIcons[ticket.status.name as keyof typeof statusIcons] || TicketIcon" class="h-4 w-4" :style="{ color: ticket.status.color }" />
                  <h3 class="font-semibold truncate">{{ ticket.title }}</h3>
                </div>
                <p v-if="ticket.description" class="text-sm text-muted-foreground line-clamp-2">{{ ticket.description }}</p>
                <div class="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>Cliente: {{ ticket.customerName || 'N/A' }}</span>
                  <span>{{ new Date(ticket.createdAt).toLocaleDateString('pt-BR') }}</span>
                </div>
                <div class="flex flex-wrap gap-1 mt-2">
                  <Badge v-for="tag in ticket.tags" :key="tag.id" variant="secondary" :style="{ backgroundColor: tag.color + '20' }">
                    {{ tag.name }}
                  </Badge>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <Badge :style="{ backgroundColor: ticket.status.color + '20', color: ticket.status.color }">
                  {{ ticket.status.name }}
                </Badge>
                <div v-if="ticket.status.name !== 'Fechado'" class="flex gap-2">
                  <Button v-if="!ticket.assignedToId" size="sm" @click="handleAcceptTicket(ticket.id)">
                    Aceitar
                  </Button>
                  <Button v-else size="sm" variant="outline" @click="handleCloseTicket(ticket.id)">
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="filteredTickets.length === 0" class="text-center py-12 text-muted-foreground">
            Nenhuma oportunidade encontrada
          </div>
        </div>
      </TabsContent>

      <TabsContent value="open">
        <div class="grid gap-4">
          <div v-for="ticket in filteredTickets" :key="ticket.id" class="bg-card rounded-lg border p-4">
            <div class="flex items-center gap-2 mb-2">
              <component :is="statusIcons[ticket.status.name as keyof typeof statusIcons] || TicketIcon" class="h-4 w-4" :style="{ color: ticket.status.color }" />
              <h3 class="font-semibold">{{ ticket.title }}</h3>
            </div>
            <div class="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Cliente: {{ ticket.customerName || 'N/A' }}</span>
              <span v-if="ticket.assignedToName">Atribuído: {{ ticket.assignedToName }}</span>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="closed">
        <div class="grid gap-4">
          <div v-for="ticket in filteredTickets" :key="ticket.id" class="bg-card rounded-lg border p-4 opacity-75">
            <div class="flex items-center gap-2 mb-2">
              <CheckCircleIcon class="h-4 w-4 text-green-600" />
              <h3 class="font-semibold">{{ ticket.title }}</h3>
            </div>
            <div class="text-sm text-muted-foreground">
              Cliente: {{ ticket.customerName || 'N/A' }}
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-bold mb-4">Nova Oportunidade</h2>
        <form @submit.prevent="handleCreateTicket" class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-1 block">Título</label>
            <Input v-model="form.title" placeholder="Nome da oportunidade" required />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Cliente</label>
            <select v-model="form.customerId" class="w-full h-10 rounded-md border border-input bg-background px-3" required>
              <option value="">Selecione um cliente</option>
              <option v-for="customer in customerStore.customers" :key="customer.id" :value="customer.id">
                {{ customer.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Descrição</label>
            <textarea v-model="form.description" class="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Detalhes da oportunidade..."></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" @click="showCreateModal = false">Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
