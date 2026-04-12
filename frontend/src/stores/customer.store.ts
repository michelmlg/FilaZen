import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'

export interface Customer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  document?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCustomerDto {
  name: string
  email?: string
  phone?: string
  document?: string
  notes?: string
}

export const useCustomerStore = defineStore('customer', () => {
  const { get, post, put, del } = useApi()
  const ws = useWebSocket()

  const customers = ref<Customer[]>([])
  const currentCustomer = ref<Customer | null>(null)
  const loading = ref(false)

  const fetchCustomers = async (filters?: { search?: string; page?: number }) => {
    loading.value = true
    try {
      customers.value = await get<Customer[]>('/customers', filters)
    } catch (e) {
      console.error('Falha ao buscar clientes', e)
    } finally {
      loading.value = false
    }
  }

  const fetchCustomer = async (id: string) => {
    loading.value = true
    try {
      currentCustomer.value = await get<Customer>(`/customers/${id}`)
      return currentCustomer.value
    } catch (e) {
      console.error('Falha ao buscar cliente', e)
      return null
    } finally {
      loading.value = false
    }
  }

  const createCustomer = async (data: CreateCustomerDto) => {
    try {
      const customer = await post<Customer>('/customers', data)
      customers.value.unshift(customer)
      return customer
    } catch (e) {
      console.error('Falha ao criar cliente', e)
      throw e
    }
  }

  const updateCustomer = async (id: string, data: Partial<CreateCustomerDto>) => {
    try {
      const updated = await put<Customer>(`/customers/${id}`, data)
      const index = customers.value.findIndex(c => c.id === id)
      if (index > -1) customers.value[index] = updated
      if (currentCustomer.value?.id === id) currentCustomer.value = updated
      return updated
    } catch (e) {
      console.error('Falha ao atualizar cliente', e)
      throw e
    }
  }

  const deleteCustomer = async (id: string) => {
    try {
      await del(`/customers/${id}`)
      customers.value = customers.value.filter(c => c.id !== id)
      if (currentCustomer.value?.id === id) currentCustomer.value = null
    } catch (e) {
      console.error('Falha ao deletar cliente', e)
      throw e
    }
  }

  const setupWebSocket = () => {
    ws.onEvent('customer:created', (customer: Customer) => {
      const exists = customers.value.find(c => c.id === customer.id)
      if (!exists) customers.value.unshift(customer)
    })
    ws.onEvent('customer:updated', (customer: Customer) => {
      const index = customers.value.findIndex(c => c.id === customer.id)
      if (index > -1) customers.value[index] = customer
    })
    ws.onEvent('customer:deleted', (data: { id: string }) => {
      customers.value = customers.value.filter(c => c.id !== data.id)
      if (currentCustomer.value?.id === data.id) currentCustomer.value = null
    })
  }

  return {
    customers,
    currentCustomer,
    loading,
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    setupWebSocket,
  }
})
