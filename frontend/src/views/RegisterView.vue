<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useApi } from '@/composables/useApi'
import { useToast } from '@/composables/useToast'
import { Loader2Icon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const auth = useAuthStore()
const { post } = useApi()
const toast = useToast()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const tenantSlug = ref('')

const loading = ref(false)
const error = ref('')

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  
  try {
    await post('/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      tenantSlug: tenantSlug.value
    })

    const success = await auth.login({
      email: email.value,
      password: password.value,
      tenantSlug: tenantSlug.value
    })

    if (success) {
      toast.success('Conta criada!', 'Bem-vindo ao FilaZen!')
      router.push('/')
    } else {
      error.value = 'Registro concluído. Faça login para continuar.'
    }
  } catch (err: any) {
    error.value = err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-foreground">Criar conta</h2>
      <p class="text-sm text-muted-foreground">
        Registre sua empresa e comece a usar o FilaZen
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleRegister">
      <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-md">
        {{ error }}
      </div>

      <div class="space-y-2">
        <Label for="tenantSlug">Nome da Empresa</Label>
        <Input 
          id="tenantSlug" 
          v-model="tenantSlug" 
          type="text" 
          placeholder="minha-empresa" 
          required 
        />
        <p class="text-xs text-muted-foreground">
          Será usado como: sua-empresa.filazen.com
        </p>
      </div>

      <div class="space-y-2">
        <Label for="name">Seu Nome</Label>
        <Input 
          id="name" 
          v-model="name" 
          type="text" 
          required 
          placeholder="João das Vendas"
          autocomplete="name"
        />
      </div>

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input 
          id="email" 
          v-model="email" 
          type="email" 
          required 
          placeholder="joao@empresa.com"
          autocomplete="email"
        />
      </div>

      <div class="space-y-2">
        <Label for="password">Senha</Label>
        <Input 
          id="password" 
          v-model="password" 
          type="password" 
          required 
          placeholder="Mínimo 6 caracteres"
          autocomplete="new-password"
        />
      </div>

      <Button type="submit" :disabled="loading" class="w-full">
        <Loader2Icon v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
        {{ loading ? 'Criando conta...' : 'Cadastrar e Entrar' }}
      </Button>
    </form>

    <div class="text-center text-sm text-muted-foreground">
      Já tem uma conta?
      <router-link to="/login" class="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline">
        Faça login
      </router-link>
    </div>
  </div>
</template>
