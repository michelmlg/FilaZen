<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useTeamStore, type TeamUser } from '@/stores/team.store'
import { useToast } from '@/composables/useToast'
import { UserIcon, PlusIcon, KeyIcon, TrashIcon, ShieldIcon, CrownIcon, UserCogIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import UserModal from '@/components/team/UserModal.vue'

const auth = useAuthStore()
const team = useTeamStore()
const toast = useToast()

const showModal = ref(false)
const editingUser = ref<TeamUser | null>(null)
const showResetPasswordModal = ref(false)
const resetPasswordData = ref<{ tempPassword?: string; name?: string } | null>(null)
const deletingUserId = ref<string | null>(null)

const roleColors = {
  ADMIN: 'bg-warning/20 text-warning',
  MANAGER: 'bg-primary/20 text-primary',
  SELLER: 'bg-muted text-muted-foreground',
}

const roleLabels = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
}

const roleIcons = {
  ADMIN: CrownIcon,
  MANAGER: ShieldIcon,
  SELLER: UserCogIcon,
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const statusColors = (meaning?: string) => {
  switch (meaning) {
    case 'AVAILABLE': return 'bg-success'
    case 'BUSY': return 'bg-destructive'
    case 'AWAY': return 'bg-warning'
    default: return 'bg-muted-foreground'
  }
}

onMounted(async () => {
  await team.fetchUsers()
})

const openCreateModal = () => {
  editingUser.value = null
  showModal.value = true
}

const openEditModal = (user: TeamUser) => {
  editingUser.value = user
  showModal.value = true
}

const handleSave = async (data: { name: string; email: string; role?: 'MANAGER' | 'SELLER' }) => {
  try {
    if (editingUser.value) {
      toast.success('Usuário atualizado!')
    } else {
      await team.createUser(data)
      toast.success('Usuário criado com sucesso!')
    }
    showModal.value = false
    await team.fetchUsers()
  } catch (err: any) {
    toast.error('Erro', err.message)
  }
}

const handleResetPassword = async (userId: string, userName: string) => {
  if (!confirm(`Resetar senha de ${userName}? Uma nova senha temporária será gerada.`)) {
    return
  }
  try {
    const response = await team.resetPassword(userId)
    resetPasswordData.value = { tempPassword: response.tempPassword, name: userName }
    showResetPasswordModal.value = true
  } catch (err: any) {
    toast.error('Erro', err.message)
  }
}

const handleDelete = async (userId: string, userName: string) => {
  if (!confirm(`Excluir usuário ${userName}? Esta ação não pode ser desfeita.`)) {
    return
  }
  deletingUserId.value = userId
  try {
    await team.deleteUser(userId)
    toast.success('Usuário excluído!')
  } catch (err: any) {
    toast.error('Erro', err.message)
  } finally {
    deletingUserId.value = null
  }
}

const handleRoleChange = async (user: TeamUser, newRole: 'MANAGER' | 'SELLER') => {
  try {
    await team.updateRole(user.id, newRole)
    toast.success(`Cargo alterado para ${roleLabels[newRole]}`)
    await team.fetchUsers()
  } catch (err: any) {
    toast.error('Erro', err.message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Equipe</h1>
        <p class="text-muted-foreground mt-1">Gerencie os membros da sua equipe</p>
      </div>
      <Button v-if="auth.isAdmin" @click="openCreateModal">
        <PlusIcon class="h-4 w-4 mr-2" />
        Novo Membro
      </Button>
    </div>

    <div v-if="team.loading" class="text-center py-12 text-muted-foreground">
      Carregando...
    </div>

    <div v-else-if="team.users.length === 0" class="text-center py-12">
      <UserIcon class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <p class="text-muted-foreground">Nenhum membro na equipe</p>
      <Button v-if="auth.isAdmin" @click="openCreateModal" variant="outline" class="mt-4">
        <PlusIcon class="h-4 w-4 mr-2" />
        Adicionar Primeiro Membro
      </Button>
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="user in team.users" :key="user.id" class="relative">
        <CardHeader class="pb-2">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <Avatar class="h-12 w-12" :src="user.avatarUrl" :alt="user.name" :fallback="getInitials(user.name)" />
              <div>
                <CardTitle class="text-base">{{ user.name }}</CardTitle>
                <p class="text-sm text-muted-foreground">{{ user.email }}</p>
              </div>
            </div>
            <Badge :class="roleColors[user.role]">
              <component :is="roleIcons[user.role]" class="h-3 w-3 mr-1" />
              {{ roleLabels[user.role] }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="statusColors(user.status?.meaning)"></span>
              <span class="text-sm text-muted-foreground">{{ user.status?.name || 'Sem status' }}</span>
            </div>
            <div v-if="auth.isAdmin && user.role !== 'ADMIN'" class="flex gap-1">
              <select
                :value="user.role"
                @change="(e) => handleRoleChange(user, (e.target as HTMLSelectElement).value as 'MANAGER' | 'SELLER')"
                class="text-xs border rounded px-2 py-1 bg-background"
              >
                <option value="MANAGER">Gerente</option>
                <option value="SELLER">Vendedor</option>
              </select>
              <Button
                @click="handleResetPassword(user.id, user.name)"
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0"
                title="Resetar senha"
              >
                <KeyIcon class="h-3 w-3" />
              </Button>
              <Button
                @click="handleDelete(user.id, user.name)"
                :disabled="deletingUserId === user.id"
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0 text-destructive hover:text-destructive"
                title="Excluir"
              >
                <TrashIcon class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <UserModal
      v-if="showModal"
      :user="editingUser"
      @close="showModal = false"
      @save="handleSave"
    />

    <div v-if="showResetPasswordModal && resetPasswordData" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card class="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Senha Resetada</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm text-muted-foreground">
            A senha de <strong>{{ resetPasswordData.name }}</strong> foi resetada.
            Forneça a seguinte senha temporária ao usuário:
          </p>
          <div class="bg-muted p-4 rounded-lg text-center font-mono text-xl tracking-wider select-all">
            {{ resetPasswordData.tempPassword }}
          </div>
          <p class="text-xs text-muted-foreground">
            O usuário deverá alterar esta senha no primeiro acesso.
          </p>
          <Button @click="showResetPasswordModal = false" class="w-full">
            Entendi
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
