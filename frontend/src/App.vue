<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { useTenantStore } from '@/stores/tenant.store'
import { useAuthStore } from '@/stores/auth.store'
import ToastContainer from '@/components/ToastContainer.vue'

const tenant = useTenantStore()
const auth = useAuthStore()

onMounted(() => {
  const isDark = localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) document.documentElement.classList.add('dark')
  
  if (localStorage.getItem('token')) {
    tenant.fetchConfig()
  }
})

watch(() => auth.user?.tenantId, async (newTenantId) => {
  if (newTenantId) {
    await tenant.fetchConfig()
  }
})
</script>

<template>
  <RouterView />
  <ToastContainer />
</template>

<style>
#app {
  @apply w-full h-full;
}
</style>
