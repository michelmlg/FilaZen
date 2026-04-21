<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { LayoutDashboardIcon, UsersIcon, HistoryIcon, SettingsIcon, LogOutIcon, UserCogIcon } from 'lucide-vue-next'

const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push('/login')
}

const navItems = [
  { name: 'Dashboard/Fila', path: '/', icon: LayoutDashboardIcon },
  { name: 'Equipe', path: '/team', icon: UserCogIcon },
  { name: 'Oportunidades', path: '/tickets', icon: HistoryIcon },
  { name: 'Clientes', path: '/customers', icon: UsersIcon },
]
</script>

<template>
  <div class="h-screen flex overflow-hidden bg-background">
    <!-- Sidebar / Nav Vertical -->
    <div class="hidden md:flex md:flex-shrink-0">
      <div class="flex flex-col w-64">
        <!-- Sidebar component -->
        <div class="flex flex-col h-0 flex-1 border-r border-border bg-card">
          <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div class="flex items-center flex-shrink-0 px-4 mb-4">
              <span class="text-xl font-bold text-foreground border-l-4 border-foreground pl-2">FilaZen</span>
            </div>
            
            <nav class="mt-5 flex-1 px-2 space-y-1">
              <router-link v-for="item in navItems" :key="item.name" :to="item.path"
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                :class="[$route.path === item.path ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground']"
              >
                <component :is="item.icon" class="mr-3 flex-shrink-0 h-5 w-5"
                  :class="[$route.path === item.path ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground']" />
                {{ item.name }}
              </router-link>

              <!-- Apenas Manager/Admin vêm os Ajustes -->
              <router-link v-if="auth.isManager" to="/settings"
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                :class="[$route.path === '/settings' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground']"
              >
                <SettingsIcon class="mr-3 flex-shrink-0 h-5 w-5"
                  :class="[$route.path === '/settings' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground']" />
                Configurações
              </router-link>
            </nav>
          </div>
          
          <div class="flex-shrink-0 flex border-t border-border p-4">
            <div class="flex items-center w-full">
              <div class="ml-3 flex-1">
                <p class="text-sm font-medium text-foreground truncate w-40">{{ auth.user?.name }}</p>
                <p class="text-xs font-medium text-muted-foreground truncate">{{ auth.user?.role }}</p>
              </div>
              <button @click="logout" class="ml-auto flex-shrink-0 p-1 text-muted hover:text-destructive" title="Sair">
                <LogOutIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <!-- Topbar mobile (Omitida por simplicidade, ideal focar no Desktop) -->
      
      <main class="flex-1 relative z-0 overflow-y-auto focus:outline-none">
        <div class="py-6">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <RouterView />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
