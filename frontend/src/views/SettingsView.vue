<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useTenantStore } from '@/stores/tenant.store'
import { useToast } from '@/composables/useToast'
import { useApi } from '@/composables/useApi'
import { SunIcon, MoonIcon, UserIcon, BuildingIcon, PaletteIcon, SaveIcon, SettingsIcon, ArrowRightIcon } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

const router = useRouter()
const auth = useAuthStore()
const tenant = useTenantStore()
const { put } = useApi()
const toast = useToast()

const isDark = ref(localStorage.getItem('theme') === 'dark')

const tenantForm = ref({
  name: '',
  primaryColor: '#3b82f6',
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

onMounted(async () => {
  await tenant.fetchConfig()
  syncTenantForm()
})

const syncTenantForm = () => {
  if (tenant.config) {
    tenantForm.value.name = tenant.config.name || ''
    tenantForm.value.primaryColor = tenant.config.primaryColor || '#3b82f6'
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

const saveTenantSettings = async () => {
  try {
    const success = await tenant.saveSettings({
      name: tenantForm.value.name,
      primaryColor: tenantForm.value.primaryColor,
    })
    if (success) {
      toast.success('Configurações salvas!')
    } else {
      toast.error('Erro', 'Não foi possível salvar.')
    }
  } catch {
    toast.error('Erro', 'Não foi possível salvar.')
  }
}

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error('Erro', 'As senhas não coincidem.')
    return
  }
  try {
    await put('/auth/password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    })
    toast.success('Senha alterada!')
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  } catch {
    toast.error('Erro', 'Não foi possível alterar a senha.')
  }
}
</script>

<template>
  <div class="space-y-6 max-w-4xl">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Configurações</h1>
      <p class="text-muted-foreground mt-1">Gerencie suas preferências e conta</p>
    </div>

    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <SunIcon class="h-5 w-5" />
          <CardTitle>Aparência</CardTitle>
        </div>
        <CardDescription>Personalize o tema do aplicativo</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Tema {{ isDark ? 'Escuro' : 'Claro' }}</p>
            <p class="text-sm text-muted-foreground">Alterne entre tema claro e escuro</p>
          </div>
          <Button @click="toggleTheme" variant="outline">
            <MoonIcon v-if="!isDark" class="h-5 w-5" />
            <SunIcon v-else class="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card v-if="auth.isManager">
      <CardHeader>
        <div class="flex items-center gap-2">
          <SettingsIcon class="h-5 w-5" />
          <CardTitle>Configurações da Fila</CardTitle>
        </div>
        <CardDescription>Gerencie estratégia, horários e histórico de snapshots</CardDescription>
      </CardHeader>
      <CardContent>
        <Button @click="router.push({ path: '/settings/queue', query: { backTo: '/settings' } })" variant="outline" class="w-full justify-between">
          Abrir Configurações da Fila
          <ArrowRightIcon class="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>

    <Card v-if="auth.isManager">
      <CardHeader>
        <div class="flex items-center gap-2">
          <BuildingIcon class="h-5 w-5" />
          <CardTitle>Empresa</CardTitle>
        </div>
        <CardDescription>Configurações da sua empresa</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-1 block">Nome da Empresa</label>
          <Input v-model="tenantForm.name" placeholder="Nome da sua empresa" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Cor Principal</label>
          <div class="flex gap-3">
            <input type="color" v-model="tenantForm.primaryColor" class="h-10 w-20 rounded border cursor-pointer" />
            <Input v-model="tenantForm.primaryColor" class="flex-1" placeholder="#3b82f6" />
          </div>
        </div>
        <Button @click="saveTenantSettings">
          <SaveIcon class="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <UserIcon class="h-5 w-5" />
          <CardTitle>Conta</CardTitle>
        </div>
        <CardDescription>Gerencie suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-1 block">Nome</label>
          <Input :model-value="auth.user?.name" disabled />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Email</label>
          <Input :model-value="auth.user?.email" disabled />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Cargo</label>
          <Input :model-value="auth.user?.role" disabled />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div class="flex items-center gap-2">
          <PaletteIcon class="h-5 w-5" />
          <CardTitle>Segurança</CardTitle>
        </div>
        <CardDescription>Altere sua senha</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <label class="text-sm font-medium mb-1 block">Senha Atual</label>
          <Input v-model="passwordForm.currentPassword" type="password" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Nova Senha</label>
          <Input v-model="passwordForm.newPassword" type="password" />
        </div>
        <div>
          <label class="text-sm font-medium mb-1 block">Confirmar Nova Senha</label>
          <Input v-model="passwordForm.confirmPassword" type="password" />
        </div>
        <Button @click="changePassword">
          <SaveIcon class="h-4 w-4 mr-2" />
          Alterar Senha
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
