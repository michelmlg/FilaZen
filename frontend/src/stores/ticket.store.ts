import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '@/composables/useApi'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from './auth.store'

export interface TicketStatus {
  id: string
  name: string
  color: string
}

export interface TicketTag {
  id: string
  name: string
  color: string
}

export interface Ticket {
  id: string
  title: string
  description?: string | null
  status: TicketStatus
  tags: TicketTag[]
  customerId: string
  customerName?: string
  assignedToId?: string | null
  assignedToName?: string
  createdById: string
  createdAt: string
  updatedAt: string
}

export interface CreateTicketDto {
  title: string
  description?: string
  customerId: string
  statusId?: string
  tagIds?: string[]
}

export interface UpdateTicketDto {
  title?: string
  description?: string
  statusId?: string
  tagIds?: string[]
  assignedToId?: string | null
}

export const useTicketStore = defineStore('ticket', () => {
  const { get, post, put, del } = useApi()
  const ws = useWebSocket()
  const auth = useAuthStore()

  const tickets = ref<Ticket[]>([])
  const currentTicket = ref<Ticket | null>(null)
  const loading = ref(false)

  const myTickets = () => tickets.value.filter(t => t.assignedToId === auth.user?.id)

  const fetchTickets = async (filters?: { statusId?: string; assignedToId?: string; search?: string }) => {
    loading.value = true
    try {
      tickets.value = await get<Ticket[]>('/tickets', filters)
    } catch (e) {
      console.error('Falha ao buscar tickets', e)
    } finally {
      loading.value = false
    }
  }

  const fetchTicket = async (id: string) => {
    loading.value = true
    try {
      currentTicket.value = await get<Ticket>(`/tickets/${id}`)
      return currentTicket.value
    } catch (e) {
      console.error('Falha ao buscar ticket', e)
      return null
    } finally {
      loading.value = false
    }
  }

  const createTicket = async (data: CreateTicketDto) => {
    try {
      const ticket = await post<Ticket>('/tickets', data)
      tickets.value.unshift(ticket)
      return ticket
    } catch (e) {
      console.error('Falha ao criar ticket', e)
      throw e
    }
  }

  const updateTicket = async (id: string, data: UpdateTicketDto) => {
    try {
      const updated = await put<Ticket>(`/tickets/${id}`, data)
      const index = tickets.value.findIndex(t => t.id === id)
      if (index > -1) tickets.value[index] = updated
      if (currentTicket.value?.id === id) currentTicket.value = updated
      return updated
    } catch (e) {
      console.error('Falha ao atualizar ticket', e)
      throw e
    }
  }

  const acceptTicket = async (id: string) => {
    try {
      const updated = await post<Ticket>(`/tickets/${id}/accept`)
      const index = tickets.value.findIndex(t => t.id === id)
      if (index > -1) tickets.value[index] = updated
      return updated
    } catch (e) {
      console.error('Falha ao aceitar ticket', e)
      throw e
    }
  }

  const closeTicket = async (id: string) => {
    try {
      const updated = await post<Ticket>(`/tickets/${id}/close`)
      const index = tickets.value.findIndex(t => t.id === id)
      if (index > -1) tickets.value[index] = updated
      return updated
    } catch (e) {
      console.error('Falha ao fechar ticket', e)
      throw e
    }
  }

  const deleteTicket = async (id: string) => {
    try {
      await del(`/tickets/${id}`)
      tickets.value = tickets.value.filter(t => t.id !== id)
      if (currentTicket.value?.id === id) currentTicket.value = null
    } catch (e) {
      console.error('Falha ao deletar ticket', e)
      throw e
    }
  }

  const setupWebSocket = () => {
    ws.onEvent('ticket:created', (ticket: Ticket) => {
      tickets.value.unshift(ticket)
    })
    ws.onEvent('ticket:updated', (ticket: Ticket) => {
      const index = tickets.value.findIndex(t => t.id === ticket.id)
      if (index > -1) tickets.value[index] = ticket
    })
    ws.onEvent('ticket:accepted', (ticket: Ticket) => {
      const index = tickets.value.findIndex(t => t.id === ticket.id)
      if (index > -1) tickets.value[index] = ticket
    })
    ws.onEvent('ticket:closed', (ticket: Ticket) => {
      const index = tickets.value.findIndex(t => t.id === ticket.id)
      if (index > -1) tickets.value[index] = ticket
    })
  }

  return {
    tickets,
    currentTicket,
    loading,
    myTickets,
    fetchTickets,
    fetchTicket,
    createTicket,
    updateTicket,
    acceptTicket,
    closeTicket,
    deleteTicket,
    setupWebSocket,
  }
})
