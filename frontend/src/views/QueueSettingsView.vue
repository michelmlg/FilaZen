<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import QueueConfigTab from '@/components/settings/QueueConfigTab.vue'
import SnapshotTab from '@/components/settings/SnapshotTab.vue'
import { ArrowLeftIcon, SettingsIcon, BarChart3Icon } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const props = defineProps<{
  backTo?: string
}>()

const activeTab = ref<'config' | 'snapshots'>('config')

onMounted(() => {
  if (!auth.isManager) {
    router.push('/')
  }
})
</script>

<template>
  <div class="container mx-auto py-6 max-w-5xl">
    <button 
      @click="router.push(props.backTo || '/settings')"
      class="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
    >
      <ArrowLeftIcon class="h-4 w-4" />
      <span>Voltar para Configurações</span>
    </button>

    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">Configurações da Fila</h1>
      <p class="text-muted-foreground mt-1">Gerencie as configurações e histórico da fila de atendimento</p>
    </div>

    <div class="border-b border-border mb-6">
      <nav class="flex gap-6">
        <button
          @click="activeTab = 'config'"
          class="flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors"
          :class="activeTab === 'config' 
            ? 'border-primary text-foreground' 
            : 'border-transparent text-muted-foreground hover:text-foreground'"
        >
          <SettingsIcon class="h-4 w-4" />
          Configurações
        </button>
        <button
          @click="activeTab = 'snapshots'"
          class="flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors"
          :class="activeTab === 'snapshots' 
            ? 'border-primary text-foreground' 
            : 'border-transparent text-muted-foreground hover:text-foreground'"
        >
          <BarChart3Icon class="h-4 w-4" />
          Histórico de Snapshots
        </button>
      </nav>
    </div>

    <div>
      <QueueConfigTab v-if="activeTab === 'config'" />
      <SnapshotTab v-else-if="activeTab === 'snapshots'" />
    </div>
  </div>
</template>
