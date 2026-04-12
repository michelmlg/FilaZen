<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-foreground tracking-tight">
          FilaZen
        </h1>
        <p class="mt-2 text-muted-foreground">
          SaaS CRM & Fila Inteligente
        </p>
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
