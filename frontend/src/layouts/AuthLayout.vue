<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

import filazenLogo from '@/assets/filazen-logo.svg'

const route = useRoute()
const auth = useAuthStore()

const showSplitLayout = computed(() => {
  return route.path === '/register' || route.path === '/select-tenant'
})
</script>

<template>
  <!-- Layout Split-Screen para Registro e Seleção de Tenant -->
  <div v-if="showSplitLayout" class="min-h-screen flex">
    <!-- Painel esquerdo decorativo -->
    <div class="hidden lg:flex lg:w-[45%] xl:w-[40%] relative overflow-hidden bg-gradient-to-br from-[#022c33] via-[#022023] to-[#01141a]">
      <!-- Elementos decorativos -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-1/4 -left-12 h-64 w-64 rounded-full bg-teal-500/30 blur-3xl" />
        <div class="absolute bottom-1/4 right-0 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div class="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-green-500/20 blur-3xl" />
      </div>

      <!-- Conteúdo do painel esquerdo -->
      <div class="relative z-10 flex flex-col justify-center px-12 lg:px-16 xl:px-24 2xl:px-32">
        <img :src="filazenLogo" alt="FilaZen" class="h-20 w-auto mb-4" />
        <p class="mt-3 text-lg text-emerald-100">
          CRM &amp; Fila Inteligente
        </p>
        <div class="mt-10 space-y-6">
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <p class="text-sm font-medium text-white">Filas inteligentes</p>
              <p class="text-sm text-emerald-200/70">Organize sua equipe com estratégias FIFO, Performance ou Híbrida.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <p class="text-sm font-medium text-white">Multi-tenant</p>
              <p class="text-sm text-emerald-200/70">Cada organização com seu espaço, dados isolados e configurações próprias.</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
            </div>
            <div>
              <p class="text-sm font-medium text-white">Métricas em tempo real</p>
              <p class="text-sm text-emerald-200/70">Acompanhe performance, tickets e conversões em um só lugar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Painel direito — formulário -->
    <div class="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto bg-background">
      <div class="w-full max-w-lg mx-auto">
        <!-- Logo visível apenas no mobile (oculto no desktop pois já está no painel esquerdo) -->
        <div class="lg:hidden text-center mb-8">
          <img :src="filazenLogo" alt="FilaZen" class="h-16 w-auto mx-auto" />
        </div>

        <RouterView />

        <p class="mt-8 text-center text-xs text-muted-foreground">
          &copy; 2026 FilaZen. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </div>

  <!-- Layout padrão (centrado com card) para Login -->
  <div v-else class="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <img :src="filazenLogo" alt="FilaZen" class="h-16 w-auto mx-auto" />
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-card rounded-xl border shadow-sm p-6 sm:p-8">
        <RouterView />
      </div>
    </div>

    <p class="mt-6 text-center text-sm text-muted-foreground">
      &copy; 2026 FilaZen. Todos os direitos reservados.
    </p>
  </div>
</template>
