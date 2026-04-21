<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCustomerStore } from '@/stores/customer.store'
import { useToast } from '@/composables/useToast'
import { ArrowLeftIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowBigRightDash } from 'lucide-vue-next'

const router = useRouter()
const customerStore = useCustomerStore()
const toast = useToast()

const loading = ref(false)
const form = ref({
  customerId: '',
  title: '',
  description: '',
  estimatedValue: undefined as number | undefined
})

const handleSubmit = async () => {
  loading.value = true
  try {
    await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: form.value.customerId || undefined,
        title: form.value.title || undefined,
        description: form.value.description || undefined,
        estimatedValue: form.value.estimatedValue
      })
    })
    toast.success('Ticket aberto!', 'Atendimento iniciado com sucesso.')
    router.push('/')
  } catch {
    toast.error('Erro', 'Não foi possível abrir o ticket.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="router.back()">
        <ArrowLeftIcon class="h-5 w-5" />
      </Button>
      <div>
        <h1 class="text-2xl font-bold text-foreground">Abrir Ticket</h1>
        <p class="text-muted-foreground">Crie uma nova oportunidade de atendimento</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="bg-card rounded-xl border p-6 space-y-6">
      <div class="space-y-2">
        <label class="text-sm font-medium">Cliente</label>
        <select 
          v-model="form.customerId" 
          class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Selecione um cliente (opcional)</option>
          <option 
            v-for="customer in customerStore.customers" 
            :key="customer.id" 
            :value="customer.id"
          >
            {{ customer.name }}
          </option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">Título</label>
        <Input 
          v-model="form.title" 
          placeholder="Atendimento #"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">Descrição</label>
        <textarea 
          v-model="form.description" 
          placeholder="Detalhes do atendimento..."
          class="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">Valor Estimado</label>
        <Input 
          v-model.number="form.estimatedValue" 
          type="number"
          step="0.01"
          placeholder="0.00"
        />
      </div>

      <div class="flex justify-end gap-3">
        <Button type="button" variant="outline" @click="router.back()">
          Cancelar
        </Button>
        <Button type="submit" :disabled="loading">
          <ArrowBigRightDash v-if="!loading" class="h-4 w-4 mr-2" />
          <span v-if="loading" class="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full" />
          Abrir Ticket
        </Button>
      </div>
    </form>
  </div>
</template>
