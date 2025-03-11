<template>
  <div class="container order-form-container mt-4">
    <div class="row">
      <div class="col-12 mb-4">
        <div id="orderInformation" class="card shadow-sm">
          <div class="card-header bg-primary text-white">
            <h4 class="card-title mb-0"><i class="fas fa-clipboard-list me-2"></i>Informações do Pedido</h4>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <div class="order-info-item" id="orderNumber">
                <strong>Número do Pedido:</strong> {{ orderData.orderNumber || 'Novo pedido' }}
              </div>
              <div class="order-info-item" id="currentDate">
                <strong>Data do Pedido:</strong> {{ currentDate }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form @submit.prevent="saveOrder" class="order-form">
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <label class="form-label">Status</label>
          <select class="form-select shadow-sm" v-model="selectedStatus">
            <option disabled value="null">Selecione um status</option>
            <option v-for="status in orderData.status" :key="status.id" :value="status.id">
              {{ status.name }}
            </option>
          </select>
        </div>
        <div class="col-md-3 mb-3">
          <label class="form-label">Cliente</label>
          <select class="form-select shadow-sm" v-model="selectedCustomer">
            <option disabled value="null">Selecione um cliente</option>
            <option v-for="customer in orderData.customer" :key="customer.id" :value="customer.id">
              {{ customer.name }}
            </option>
          </select>
        </div>
        <div class="col-md-3 mb-3">
          <label class="form-label">Vendedor</label>
          <select class="form-select shadow-sm" v-model="selectedSeller">
            <option disabled value="null">Selecione um vendedor</option>
            <option v-for="seller in orderData.seller" :key="seller.id" :value="seller.id">
              {{ seller.full_name }}
            </option>
          </select>
        </div>
        <div class="col-md-3 mb-3">
          <label class="form-label">Origem</label>
          <select class="form-select shadow-sm" v-model="selectedOrigin">
            <option disabled value="null">Selecione uma origem</option>
            <option v-for="origin in orderData.origin" :key="origin.id" :value="origin.id">
              {{ origin.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">Detalhes do Pedido</h5>
        </div>
        <div class="card-body">
          <div class="mb-3">
            <label for="description" class="form-label">Descrição:</label>
            <textarea
              class="form-control shadow-sm"
              id="description"
              rows="3"
              v-model="orderData.description"
              placeholder="Digite a descrição do pedido"
            ></textarea>
          </div>
          <div class="mb-3">
            <label for="notes" class="form-label">Notas:</label>
            <textarea
              class="form-control shadow-sm"
              id="notes"
              rows="2"
              v-model="orderData.notes"
              placeholder="Adicione notas ou informações adicionais"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="card shadow-sm mb-4">
        <div class="card-header bg-light">
          <h5 class="mb-0">Informações Financeiras</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label">Valor Estimado</label>
              <div class="input-group">
                <span class="input-group-text">R$</span>
                <input
                  type="number"
                  step="0.01"
                  class="form-control shadow-sm"
                  v-model="orderData.value"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Desconto</label>
              <div class="input-group">
                <span class="input-group-text">R$</span>
                <input
                  type="number"
                  step="0.01"
                  class="form-control shadow-sm"
                  v-model="orderData.discount"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label">Valor Final</label>
              <div class="input-group">
                <span class="input-group-text">R$</span>
                <input
                  type="text"
                  class="form-control shadow-sm"
                  :value="calculateFinalValue"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="d-grid gap-2">
        <button type="submit" class="btn btn-primary btn-lg shadow">
          <i class="fas fa-save me-2"></i> Salvar Pedido
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      selectedStatus: null,
      selectedCustomer: null,
      selectedSeller: null,
      selectedOrigin: null,
      orderData: {
        status: [],
        customer: [],
        seller: [],
        origin: [],
        value: 0,
        discount: 0,
        deliveryDate: "",
        description: "",
        notes: "",
        orderNumber: "",
        orderDate: "",
      },
      currentDate: '',
      isLoading: true,
      saveSuccess: false
    };
  },
  computed: {
    calculateFinalValue() {
      const value = parseFloat(this.orderData.value) || 0;
      const discount = parseFloat(this.orderData.discount) || 0;
      return (value - discount).toFixed(2);
    }
  },
  async mounted() {
    try {
      this.getCurrentDate();
      this.orderData.orderDate = this.currentDate;
      await this.fetchData();
    } catch (error) {
      console.error("Error in mounted:", error);
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    getCurrentDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hours = String(today.getHours()).padStart(2, '0');
      const minutes = String(today.getMinutes()).padStart(2, '0');
      this.currentDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    },
    async saveOrder() {
      if (!this.validateForm()) {
        return;
      }
      
      const dataToSend = {
        ...this.orderData,
        status_id: this.selectedStatus,
        client_id: this.selectedCustomer,
        employee_id: this.selectedSeller,
        origin_id: this.selectedOrigin,
        estimated_value: parseFloat(this.orderData.value),
        discount: parseFloat(this.orderData.discount)
      };

      try {
        this.isLoading = true;
        const response = await fetch('/backend/controllers/orderController.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Order saved successfully:', data);
        this.saveSuccess = true;
        // Could add a toast notification here
        
      } catch (error) {
        console.error('Error saving order:', error);
        // Could add error toast here
      } finally {
        this.isLoading = false;
      }
    },
    validateForm() {
      // Add validation logic here
      if (!this.selectedStatus || !this.selectedCustomer || !this.selectedSeller) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return false;
      }
      return true;
    },
    async fetchData() {
      try {
        // Fetch status data
        const statusResponse = await fetch('/backend/controllers/orderController.php?getStatus=true');
        if (!statusResponse.ok) throw new Error('Failed to fetch status data');
        
        // Fetch customer data
        const customerResponse = await fetch('/backend/controllers/clientController.php');
        if (!customerResponse.ok) throw new Error('Failed to fetch customer data');
        
        // Fetch seller data
        const sellerResponse = await fetch('/backend/controllers/userController.php');
        if (!sellerResponse.ok) throw new Error('Failed to fetch seller data');
        
        // Fetch origin data
        const originResponse = await fetch('/backend/controllers/orderController.php?getOrigin=true');
        if (!originResponse.ok) throw new Error('Failed to fetch origin data');
        
        // Extract data from responses
        const statusData = await statusResponse.json();
        const customerData = await customerResponse.json();
        const sellerData = await sellerResponse.json();
        const originData = await originResponse.json();

        // Assign correctly
        this.orderData = {
          ...this.orderData,
          status: statusData.status_list || [],        // Extract status_list array
          customer: customerData.clients || [],        // Extract data array from customer response
          seller: sellerData.data || [],              // Extract data array from seller response
          origin: originData.origin_list || []        // Extract origin_list array
        };

        console.log("Data loaded successfully:", {
          status: this.orderData.status.length,
          customers: this.orderData.customer.length,
          sellers: this.orderData.seller.length,
          origins: this.orderData.origin.length
        });

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  }
};
</script>

<style scoped>
.order-form-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 2rem;
}

.order-form {
  transition: all 0.3s ease;
}

.order-info-item {
  font-size: 1.1rem;
}

.card {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.125);
  transition: box-shadow 0.3s ease;
}

.card:hover {
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1) !important;
}

.card-header {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.form-control:focus, .form-select:focus {
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #0069d9;
  border-color: #0062cc;
  transform: translateY(-2px);
}

.form-label {
  font-weight: 500;
}

/* Animation for form changes */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

.btn-lg {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
}
</style>

