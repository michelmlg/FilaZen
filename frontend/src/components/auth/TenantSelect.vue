<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { TenantOption } from '@/stores/auth.store'
import { Loader2Icon, BuildingIcon, ArrowLeftIcon } from 'lucide-vue-next'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const auth = useAuthStore()
const router = useRouter()

const handleSelect = async (tenant: TenantOption) => {
  const success = await auth.selectTenant(tenant.slug)
  if (success) {
    router.push('/')
  }
}

const handleBack = () => {
  auth.clearPending()
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2 text-center">
      <h2 class="text-2xl font-bold tracking-tight text-foreground">Selecionar empresa</h2>
      <p class="text-sm text-muted-foreground">
        Sua conta pertence a múltiplas empresas. Selecione uma para continuar.
      </p>
    </div>

    <div v-if="auth.error" class="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-md">
      {{ auth.error }}
    </div>

    <div class="space-y-3">
      <Card
        v-for="tenant in auth.pendingTenants"
        :key="tenant.id"
        class="cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md hover:shadow-primary/10"
        @click="handleSelect(tenant)"
      >
        <CardContent class="flex items-center gap-4 p-4">
          <!-- Ícone/Logo da empresa -->
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <img
              v-if="tenant.logoUrl"
              :src="tenant.logoUrl"
              :alt="tenant.name"
              class="h-10 w-10 rounded-lg object-contain"
            />
            <BuildingIcon v-else class="h-6 w-6" />
          </div>

          <!-- Informações -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-foreground truncate">{{ tenant.name }}</p>
            <p class="text-sm text-muted-foreground truncate">{{ tenant.slug }}.filazen.com</p>
          </div>

          <!-- Loading indicator -->
          <Loader2Icon v-if="auth.loading" class="animate-spin h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </div>

    <Button variant="ghost" class="w-full" @click="handleBack">
      <ArrowLeftIcon class="h-4 w-4 mr-2" />
      Voltar ao login
    </Button>
  </div>
</template>
