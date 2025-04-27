<template>
  <div class="container py-4">
    <div class="d-flex align-items-center mb-4">
      <i class="fas fa-cogs fa-2x text-primary me-3"></i>
      <h2 class="mb-0">Configurações da Fila</h2>
      <button @click="toggleQueue" class="btn btn-dark ms-auto">
        <i :class="queueLocked ? 'fas fa-pause' : 'fas fa-play'" class="me-2"></i> 
        {{ queueLocked ? 'Queue Paused' : 'Queue Active' }}
      </button>
    </div>

    <div class="mb-4">
      <h5>Estratégia da Fila</h5>
      <div class="d-flex gap-3">
        <button
          v-for="strategy in strategies"
          :key="strategy.value"
          @click="selectStrategy(strategy)"
          :class="['btn', selectedStrategy === strategy.value ? 'btn-primary' : 'btn-outline-primary', 'px-4', 'py-2']"
        >
          <i :class="['me-2', strategy.icon]"></i> {{ strategy.label }}
        </button>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-12">
        <div class="card p-4">
          <h6 class="mb-3">{{ currentStrategyTitle }}</h6>

          <div v-if="selectedStrategy === 'updated_at_strategy'">
            <p class="text-muted mb-2">Configure a ordem de chegada</p>
            <select v-model="selectedUpdatedAtOrder" @change="updateUpdatedAtOrder" class="form-select w-auto">
              <option value="ASC" selected>Oldest First</option>
              <option value="DESC" >Newest First</option>
            </select>
          </div>

          <div v-else-if="selectedStrategy === 'performance_strategy'">
            <p class="text-muted mb-2">Configure a fila com base nas métricas de performance</p>
            <select class="form-select" v-model="selectedPerformanceCriteria" @change="selectPerformanceCriteria">
              <option selected disabled>Escolha o critério de performance</option>
              <option value="total_orders">Quantidade de atendimentos abertos</option>
              <option value="total_sells">Total de vendas realizadas</option>
              <option value="total_value">Quantia total em vendas</option>
              <option value="response_time">Tempo médio de resolução de atendimentos</option>
            </select>
          </div>

          <div v-else-if="selectedStrategy === 'random_strategy'">
            <p class="text-muted mb-2">Entradas serão pegas aleatóriamente</p>
            <div class="form-check">
            
            </div>
          </div>

          <small class="text-muted mt-4">
            <i class="fa-solid fa-circle-info"></i>
            Ao alterar a estratégia, a fila será reordenada na próxima atualização.
          </small>
        </div>
      </div>

      <div class="col-md-6 d-flex align-items-stretch">
        <div class="card p-4 w-100">
          <h6>Capacidade da Fila</h6>
          <p class="text-muted mb-2">Máximo de usuários na fila</p>
          <input type="number" class="form-control" @change="updateQueueCapacity" v-model="queueCapacity" min="1" />
        </div>
      </div>

      <div class="col-md-6 d-flex align-items-stretch">
        <div class="card p-4 w-100">
          <h6>Taxa de atualização</h6>
          <p class="text-muted mb-2">Configure a frequencia de atualização</p>
          <div class="d-flex align-items-center gap-2">
            <input type="number" class="form-control w-50" v-model="refreshFrequency" min="1" @change="updateRefreshSettings" />
            <select class="form-select w-50" v-model="refreshUnit" @change="updateRefreshSettings">
              <option value="minutes">Minutos</option>
              <option value="hours">Horas</option>
            </select>
          </div>
          <small class="text-muted d-block mt-2">
            Last update: {{ lastUpdate }}
          </small>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: "Rules",
  data() {
    return {
      queueCapacity: null,
      refreshFrequency: null,
      refreshUnit: null,
      lastUpdate: null,
      queueLocked: null,
      selectedStrategy: null,
      selectedPerformanceCriteria: null,
      selectedUpdatedAtOrder: null,
      strategies: [
        {
          label: 'Ordem de chegada',
          value: 'updated_at_strategy',
          icon: 'fas fa-list-ol'
        },
        {
          label: 'Performance',
          value: 'performance_strategy',
          icon: 'fas fa-chart-line'
        },
        {
          label: 'Aleatório',
          value: 'random_strategy',
          icon: 'fas fa-random'
        },
      ],
    };
  },
  computed: {
    currentStrategyTitle() {
      switch (this.selectedStrategy) {
        case 'updated_at':
          return 'Configurações de Ordem de Chegada';
        case 'performance':
          return 'Configurações de Performance';
        case 'random':
          return 'Configurações da seleção aleatória';
        default:
          return '';
      }
    }
  },
  methods: {
    async fetchSettings() {
      const response = await fetch('/backend/controllers/queueSettingsController.php');
      const data = await response.json();

      if (data.status === 'success') {
        this.queueCapacity = data.queue_settings.max_size;
        this.refreshFrequency = data.queue_settings.refresh_interval;
        this.refreshUnit = data.queue_settings.refresh_time_unit;
        this.selectedStrategy = data.queue_settings.strategy;
        this.selectedPerformanceCriteria = data.queue_settings.strategy_performance_criteria;
        this.queueLocked = data.queue_settings.queue_locked === 'true';
        this.selectedUpdatedAtOrder = data.queue_settings.strategy_updated_at_order;

        console.log('Settings fetched successfully:', data);
      } else {
        console.error('Error fetching settings:', data);
      }
    },
    async changeSetting(setting_key, value) {
      const response = await fetch('/backend/controllers/queueSettingsController.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: setting_key,
          value: value
        })
      });
      
      const data = await response.json();

      return data;
    },
    showToast(message, type = 'info') {
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: type, // pode ser 'success', 'error', 'warning', 'info', 'question'
        title: message,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    },

    async toggleQueue() {
      this.queueLocked = !this.queueLocked;

      const response = await this.changeSetting('queue_locked', this.queueLocked ? 'true' : 'false');
    

      if (response.status === 'success') {
        this.showToast(this.queueLocked ? 'Queue started' : 'Queue paused');
      } else {
        this.queueLocked = !this.queueLocked;
        console.error('Error toggling queue:', data);
      }

    },

    async selectStrategy(strategy) {
      const confirmation = await Swal.fire({
        title: 'Confirmar alteração?',
        text: `Deseja realmente mudar para a estratégia: ${strategy.label}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, alterar',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmation.isConfirmed) {
        return; // Se o usuário cancelar, simplesmente sai da função
      }

      this.selectedStrategy = strategy.value;

      const data = await this.changeSetting('strategy', strategy.value);

      if (data.status === 'success') {
        this.selectedStrategy = strategy.value;
        this.showToast(`Estratégia de ordenação alterada para: ${strategy.label}`);
      } else {
        this.selectedStrategy = 'updated_at'; // Resetar para padrão em caso de erro
        this.showToast('Falha ao alterar estratégia', 'error');
        console.error('Error updating strategy:', data);
      }
    },

    async selectPerformanceCriteria() {
      const data = await this.changeSetting('strategy_performance_criteria', this.selectedPerformanceCriteria);

      if (data.status === 'success') {
        this.showToast(`Critério de performance alterado para: ${this.selectedPerformanceCriteria}`);
      } else {
        this.showToast('Falha ao alterar critério de performance', 'error');
        console.error('Error updating performance criteria:', data);
      }
    },

    async updateQueueCapacity() {
      const data = await this.changeSetting('max_size', this.queueCapacity);

      if (data.status === 'success') {
        this.showToast('Capacidade da fila atualizada com sucesso');
      } else {
        this.showToast('Falha ao atualizar capacidade da fila', 'error');
        console.error('Error updating queue capacity:', data);
      }
    },

    async updateRefreshSettings() {
      const intervalData = await this.changeSetting('refresh_interval', this.refreshFrequency);
      const unitData = await this.changeSetting('refresh_time_unit', this.refreshUnit);

      if (intervalData.status === 'success' && unitData.status === 'success') {
        this.showToast('Configurações de atualização salvas com sucesso');
      } else {
        this.showToast('Falha ao salvar configurações de atualização', 'error');
        console.error('Error updating refresh settings:', { intervalData, unitData });
      }
    },

    async updateUpdatedAtOrder() {
      const data = await this.changeSetting('strategy_updated_at_order', this.selectedUpdatedAtOrder);

      if (data.status === 'success') {
        this.showToast('Ordem de chegada atualizada com sucesso');
      } else {
        this.showToast('Falha ao atualizar ordem de chegada', 'error');
        console.error('Error updating updated_at order:', data);
      }
    },


  },
  async mounted() {
    await this.fetchSettings();

    console.log(this.queueCapacity);
    console.log(this.refreshFrequency);
    console.log(this.refreshUnit);
    console.log(this.selectedStrategy);
    console.log(this.selectedPerformanceCriteria);
    console.log(this.queueLocked);
    console.log(this.selectedUpdatedAtOrder);
    console.log(this.strategies);
    console.log(this.currentStrategyTitle);
  },
};
</script>

<style scoped>
.card {
  border-radius: 0.5rem;
  border: 1px solid #ccc;
  background-color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.toast {
  max-width: 300px;
  border-radius: 0.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
</style>


