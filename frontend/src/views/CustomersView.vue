<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCustomerStore, type CreateCustomerDto } from '@/stores/customer.store'
import { useToast } from '@/composables/useToast'
import { PlusIcon, SearchIcon, MailIcon, PhoneIcon, EditIcon, TrashIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'

const customerStore = useCustomerStore()
const toast = useToast()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const searchQuery = ref('')
const editingCustomer = ref<string | null>(null)

const form = ref<CreateCustomerDto>({
  name: '',
  email: '',
  phone: '',
  document: '',
  notes: '',
})

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customerStore.customers
  const query = searchQuery.value.toLowerCase()
  return customerStore.customers.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.email?.toLowerCase().includes(query) ||
    c.phone?.includes(query)
  )
})

onMounted(() => {
  customerStore.fetchCustomers()
  customerStore.setupWebSocket()
})

const handleCreate = async () => {
  try {
    await customerStore.createCustomer(form.value)
    toast.success('Cliente criado!', `${form.value.name} foi adicionado.`)
    showCreateModal.value = false
    form.value = { name: '', email: '', phone: '', document: '', notes: '' }
  } catch {
    toast.error('Erro', 'Não foi possível criar o cliente.')
  }
}

const openEdit = (customer: typeof customerStore.customers[0]) => {
  editingCustomer.value = customer.id
  form.value = {
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    document: customer.document || '',
    notes: customer.notes || '',
  }
  showEditModal.value = true
}

const handleUpdate = async () => {
  if (!editingCustomer.value) return
  try {
    await customerStore.updateCustomer(editingCustomer.value, form.value)
    toast.success('Cliente atualizado!')
    showEditModal.value = false
    editingCustomer.value = null
    form.value = { name: '', email: '', phone: '', document: '', notes: '' }
  } catch {
    toast.error('Erro', 'Não foi possível atualizar o cliente.')
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return
  try {
    await customerStore.deleteCustomer(id)
    toast.info('Cliente removido')
  } catch {
    toast.error('Erro', 'Não foi possível excluir o cliente.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Clientes</h1>
        <p class="text-muted-foreground mt-1">Gerencie seus leads e clientes</p>
      </div>
      <Button @click="showCreateModal = true">
        <PlusIcon class="h-5 w-5 mr-2" />
        Novo Cliente
      </Button>
    </div>

    <div class="relative max-w-md">
      <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input v-model="searchQuery" placeholder="Buscar clientes..." class="pl-10" />
    </div>

    <div class="bg-card rounded-xl border shadow-sm overflow-hidden">
      <table class="w-full">
        <thead class="bg-muted/30">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contato</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Documento</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y">
          <tr v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-muted/30 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <Avatar :fallback="customer.name" />
                <span class="font-medium">{{ customer.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="space-y-1 text-sm">
                <div v-if="customer.email" class="flex items-center gap-2 text-muted-foreground">
                  <MailIcon class="h-4 w-4" />
                  {{ customer.email }}
                </div>
                <div v-if="customer.phone" class="flex items-center gap-2 text-muted-foreground">
                  <PhoneIcon class="h-4 w-4" />
                  {{ customer.phone }}
                </div>
                <span v-if="!customer.email && !customer.phone" class="text-muted-foreground">Sem contato</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <Badge v-if="customer.document" variant="outline">{{ customer.document }}</Badge>
              <span v-else class="text-muted-foreground text-sm">-</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex justify-end gap-2">
                <Button size="sm" variant="ghost" @click="openEdit(customer)">
                  <EditIcon class="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" @click="handleDelete(customer.id)" class="text-destructive hover:text-destructive">
                  <TrashIcon class="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredCustomers.length === 0" class="p-8 text-center text-muted-foreground">
        Nenhum cliente encontrado
      </div>
    </div>

    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-bold mb-4">Novo Cliente</h2>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-1 block">Nome *</label>
            <Input v-model="form.name" placeholder="Nome completo" required />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Email</label>
            <Input v-model="form.email" type="email" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Telefone</label>
            <Input v-model="form.phone" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Documento</label>
            <Input v-model="form.document" placeholder="CPF/CNPJ" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Observações</label>
            <textarea v-model="form.notes" class="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" @click="showCreateModal = false">Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-background rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-bold mb-4">Editar Cliente</h2>
        <form @submit.prevent="handleUpdate" class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-1 block">Nome *</label>
            <Input v-model="form.name" placeholder="Nome completo" required />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Email</label>
            <Input v-model="form.email" type="email" placeholder="email@exemplo.com" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Telefone</label>
            <Input v-model="form.phone" placeholder="(11) 99999-9999" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Documento</label>
            <Input v-model="form.document" placeholder="CPF/CNPJ" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Observações</label>
            <textarea v-model="form.notes" class="w-full h-20 rounded-md border border-input bg-background px-3 py-2 text-sm"></textarea>
          </div>
          <div class="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" @click="showEditModal = false">Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
