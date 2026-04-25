<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { Loader2Icon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')

const handleLogin = async () => {
  const result = await auth.login({
    email: email.value,
    password: password.value,
  })

  if (result === 'success') {
    router.push('/')
  } else if (result === 'select-tenant') {
    router.push('/select-tenant')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-foreground">Acessar conta</h2>
      <p class="text-sm text-muted-foreground">
        Entre com suas credenciais para acessar o sistema
      </p>
    </div>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <div v-if="auth.error" class="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-md">
        {{ auth.error }}
      </div>

      <div class="space-y-2">
        <Label for="email">Email</Label>
        <Input
          id="email"
          v-model="email"
          type="email"
          placeholder="joao@empresa.com"
          required
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
          autocomplete="current-password"
        />
      </div>

      <Button type="submit" :disabled="auth.loading" class="w-full">
        <Loader2Icon v-if="auth.loading" class="animate-spin -ml-1 mr-2 h-4 w-4" />
        {{ auth.loading ? 'Entrando...' : 'Entrar' }}
      </Button>
    </form>

    <div class="text-center text-sm text-muted-foreground">
      Não tem acesso?
      <router-link to="/register" class="font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline">
        Registre-se agora
      </router-link>
    </div>
  </div>
</template>
