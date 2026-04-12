<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TeamUser } from '@/stores/team.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const props = defineProps<{
  user?: TeamUser | null
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; email: string; role?: 'MANAGER' | 'SELLER' }]
}>()

const form = ref({
  name: '',
  email: '',
  role: 'SELLER' as 'MANAGER' | 'SELLER',
})

watch(() => props.user, (user) => {
  if (user) {
    form.value = {
      name: user.name,
      email: user.email,
      role: user.role === 'ADMIN' ? 'SELLER' : user.role,
    }
  } else {
    form.value = { name: '', email: '', role: 'SELLER' }
  }
}, { immediate: true })

const handleSubmit = () => {
  if (!form.value.name.trim()) return
  if (!form.value.email.trim() || !form.value.email.includes('@')) return
  
  emit('save', {
    name: form.value.name.trim(),
    email: form.value.email.trim(),
    role: form.value.role,
  })
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Card class="w-full max-w-md mx-4">
      <CardHeader>
        <CardTitle>{{ user ? 'Editar Membro' : 'Novo Membro' }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-1 block">Nome</label>
          <Input v-model="form.name" placeholder="Nome completo" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Email</label>
          <Input v-model="form.email" type="email" placeholder="email@exemplo.com" :disabled="!!user" />
        </div>
        <div v-if="!user">
          <label class="text-sm font-medium mb-1 block">Cargo</label>
          <select v-model="form.role" class="w-full h-10 px-3 border rounded-md bg-background">
            <option value="SELLER">Vendedor</option>
            <option value="MANAGER">Gerente</option>
          </select>
        </div>
        <div class="flex gap-2 pt-4">
          <Button @click="emit('close')" variant="outline" class="flex-1">
            Cancelar
          </Button>
          <Button @click="handleSubmit" class="flex-1">
            {{ user ? 'Salvar' : 'Criar' }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
