<script setup lang="ts">
import { computed } from 'vue'
import { UsersIcon, TargetIcon } from 'lucide-vue-next'

const props = defineProps<{
  totalInQueue: number
  userPosition?: number
  isUserInQueue: boolean
  isUserTop: boolean
}>()

const queueStatus = computed(() => {
  if (props.totalInQueue === 0) return 'empty'
  if (props.isUserTop) return 'your-turn'
  if (props.isUserInQueue) return 'waiting'
  return 'observing'
})

const statusConfig = computed(() => {
  switch (queueStatus.value) {
    case 'empty':
      return {
        title: 'Fila Vazia',
        description: 'Aguarde alguém entrar na fila',
        icon: UsersIcon,
        color: 'neutral'
      }
    case 'your-turn':
      return {
        title: 'Sua Vez!',
        description: 'Você é o próximo a ser atendido',
        icon: TargetIcon,
        color: 'highlight'
      }
    case 'waiting':
      return {
        title: `Posição #${props.userPosition}`,
        description: 'Aguarde sua vez',
        icon: UsersIcon,
        color: 'neutral'
      }
    default:
      return {
        title: `${props.totalInQueue} na fila`,
        description: 'Observe a fila',
        icon: UsersIcon,
        color: 'neutral'
      }
  }
})
</script>

<template>
  <div class="h-full flex items-center justify-center p-6">
    <div class="text-center space-y-6 max-w-xs mx-auto">
      <div class="flex justify-center">
        <div class="rounded-full p-4 bg-muted">
          <component 
            :is="statusConfig.icon" 
            class="h-8 w-8 text-muted-foreground"
          />
        </div>
      </div>

      <div class="space-y-1">
        <h3 
          class="text-3xl font-semibold"
          :class="{
            'text-foreground font-bold': statusConfig.color === 'highlight',
            'text-foreground': statusConfig.color === 'neutral'
          }"
        >
          {{ statusConfig.title }}
        </h3>
        <p class="text-muted-foreground text-sm">
          {{ statusConfig.description }}
        </p>
      </div>

      <div class="pt-4 border-t border-border">
        <div class="flex justify-center gap-10">
          <div class="text-center">
            <div class="text-2xl font-semibold text-foreground">
              {{ totalInQueue }}
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Total
            </div>
          </div>
          <div v-if="isUserInQueue" class="text-center">
            <div class="text-2xl font-semibold text-foreground">
              #{{ userPosition }}
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Sua Posição
            </div>
          </div>
          <div v-else class="text-center">
            <div class="text-2xl font-semibold text-muted">
              -
            </div>
            <div class="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Você
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
