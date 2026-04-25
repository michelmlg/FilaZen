<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { TenantOption } from '@/stores/auth.store'
import {
  Loader2Icon,
  BuildingIcon,
  ArrowLeftIcon,
  SearchIcon,
  CheckIcon,
} from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

const auth = useAuthStore()
const router = useRouter()

const searchQuery = ref('')
const selectedTenantId = ref<string | null>(null)
const loading = ref(false)
const error = ref('')

const filteredTenants = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return auth.pendingTenants
  return auth.pendingTenants.filter(t =>
    t.name.toLowerCase().includes(query) ||
    t.slug.toLowerCase().includes(query)
  )
})

const handleSelect = async (tenant: TenantOption) => {
  if (loading.value) return
  
  selectedTenantId.value = tenant.id
  loading.value = true
  error.value = ''

  try {
    const success = await auth.selectTenant(tenant.slug)
    if (success) {
      router.push('/')
    } else {
      error.value = auth.error || 'Erro ao selecionar empresa.'
      selectedTenantId.value = null
    }
  } catch (e: any) {
    error.value = e.message || 'Erro ao selecionar empresa.'
    selectedTenantId.value = null
  } finally {
    loading.value = false
  }
}

const handleBack = () => {
  auth.clearPending()
  router.push('/login')
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

    <!-- Barra de busca -->
    <div class="relative">
      <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar empresa..."
        class="pl-10"
      />
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-lg">
      {{ error }}
    </div>

    <!-- Lista de tenants com scroll -->
    <div class="max-h-[320px] overflow-y-auto space-y-3 pr-2 -mr-2">
      <Card
        v-for="tenant in filteredTenants"
        :key="tenant.id"
        :class="[
          'cursor-pointer transition-all duration-200',
          selectedTenantId === tenant.id
            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
            : 'hover:border-primary/50 hover:shadow-sm hover:shadow-primary/5',
        ]"
        @click="handleSelect(tenant)"
      >
        <CardContent class="flex items-center gap-4 p-4">
          <!-- Ícone/Logo da empresa -->
          <div
            :class="[
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors',
              selectedTenantId === tenant.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            ]"
          >
            <img
              v-if="tenant.logoUrl"
              :src="tenant.logoUrl"
              :alt="tenant.name"
              class="h-10 w-10 rounded-lg object-cover"
            />
            <BuildingIcon v-else class="h-6 w-6" />
          </div>

          <!-- Informações -->
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-foreground truncate">{{ tenant.name }}</p>
            <p class="text-sm text-muted-foreground truncate">{{ tenant.slug }}.filazen.com</p>
          </div>

          <!-- Indicadores -->
          <div class="flex items-center gap-2 shrink-0">
            <Loader2Icon
              v-if="selectedTenantId === tenant.id && loading"
              class="animate-spin h-5 w-5 text-primary"
            />
            <CheckIcon
              v-else-if="selectedTenantId === tenant.id"
              class="h-5 w-5 text-primary"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Estado vazio -->
      <div
        v-if="filteredTenants.length === 0"
        class="text-center py-8 text-muted-foreground"
      >
        <BuildingIcon class="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p class="text-sm">Nenhuma empresa encontrada</p>
      </div>
    </div>

    <Button variant="ghost" class="w-full" @click="handleBack">
      <ArrowLeftIcon class="h-4 w-4 mr-2" />
      Voltar ao login
    </Button>
  </div>
</template>

<style scoped>
/* Scrollbar customizada */
.max-h-\[320px\].overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.max-h-\[320px\].overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.max-h-\[320px\].overflow-y-auto::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 3px;
}

.max-h-\[320px\].overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}
</style>