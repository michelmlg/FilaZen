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
                <strong>Número do Pedido:</strong> 
                <span v-if="newOrder.id">#{{ newOrder.id }}</span>
                <span v-else class="text-muted">Novo pedido (não salvo)</span>
              </div>
              <div class="order-info-item" id="currentDate">
                <strong>Data do Pedido:</strong> {{ currentDate }}
              </div>
            </div>
            
            <!-- Loading indicator when creating order -->
            <div v-if="isLoading" class="mt-3 text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <small class="d-block mt-2 text-muted">Configurando novo pedido...</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form @submit.prevent="saveOrder" class="order-form">
      <!-- Delivery Date -->
      <div class="row mb-4">
        <div class="col-md-3 mb-3">
          <label class="form-label">Delivery Date</label>
          <input type="date" 
                v-model="newOrder.delivery_date" 
                class="form-control shadow-sm" 
                required>
        </div>
        
        <!-- Status -->
        <div class="col-md-3 mb-3">
          <label class="form-label">Status</label>
          <select class="form-select shadow-sm" v-model="selectedStatus">
            <option disabled value="null">Selecione um status</option>
            <option v-for="status in orderData.status" :key="status.id" :value="status.id">
              {{ status.name }}
            </option>
          </select>
        </div>

        <!-- Customer -->
        <div class="col-md-3 mb-3">
          <label class="form-label">Cliente</label>
          <select class="form-select shadow-sm" v-model="selectedCustomer">
            <option disabled value="null">Selecione um cliente</option>
            <option v-for="customer in orderData.customer" :key="customer.id" :value="customer.id">
              {{ customer.name }}
            </option>
          </select>
          
          <!-- Client Info Display -->
          <div v-if="selectedClient" class="client-info mt-2 p-2 border rounded bg-light">
            <small class="d-block">CPF: {{ selectedClient.cpf }}</small>
            <small class="d-block">Email: {{ selectedClient.email }}</small>
          </div>
        </div>

        <!-- Seller -->
        <div class="col-md-3 mb-3">
          <label class="form-label">Vendedor</label>
          <select class="form-select shadow-sm" v-model="selectedSeller">
            <option disabled value="null">Selecione um vendedor</option>
            <option v-for="seller in orderData.seller" :key="seller.id" :value="seller.id">
              {{ seller.full_name }}
            </option>
          </select>
        </div>
      </div>
      
      <!-- Origin -->
      <div class="row mb-4">
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
      
      <!-- Order Details -->
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

      <!-- Financial Information -->
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

      <!-- Submit Button -->
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
      selectedClient: null,
      newOrder: {
        id: null,
        delivery_date: '',
      },
      orderData: {
        status: [],
        customer: [],
        seller: [],
        origin: [],
        value: 0,
        discount: 0,
        description: "",
        notes: "",
      },
      currentDate: '',
      isLoading: true,
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
      // Extract the order ID from the route parameters
      //const orderId = this.$route.query.id;
      this.newOrder.id = this.$route.query.id;
     
    
       await this.fetchData();
      
    } catch (error) {
      console.error("Error in mounted:", error);
    } finally {
      this.isLoading = false;
    }
  },
  watch: {
    selectedCustomer(newVal) {
      this.selectedClient = this.orderData.customer.find(c => c.id === newVal);
    }
  },
  methods: {
    async saveOrder() {
      if (!this.validateForm()) return;

      // Include only necessary fields, including the ID
      const dataToSend = {
        action: "createOrder",
        id: this.newOrder.id, // Include the order ID
        client_id: this.selectedCustomer,
        status_id: this.selectedStatus,
        employee_id: this.selectedSeller,
        origin_id: this.selectedOrigin,
        delivery_date: this.newOrder.delivery_date,
        estimated_value: parseFloat(this.orderData.value) || 0,
        discount: parseFloat(this.orderData.discount) || 0,
        description: this.orderData.description || '',
        notes: this.orderData.notes || ''
      };

      console.log("Sending data:", dataToSend); // Debug what we're sending

      try {
        this.isLoading = true;
        const response = await fetch('/backend/controllers/orderController.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSend)
        });

        // Get response as text first for debugging
        const responseText = await response.text();
        console.log("Response text:", responseText);
        
        // Then parse as JSON (if possible)
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error("Invalid JSON response: " + responseText);
        }
        
        if (data.status === 'success') {
          if (data.id) {
            this.newOrder.id = data.id;
          }
          
          // SweetAlert2 usage (assuming it's correctly loaded via CDN)
          if (window.Swal) {
            window.Swal.fire({
              icon: 'success',
              title: 'Pedido Salvo!',
              text: `Pedido #${this.newOrder.id} salvo com sucesso!`,
              confirmButtonColor: '#28a745',
              timer: 3000
            });
          } else {
            console.warn('SweetAlert2 not loaded.  Check your CDN inclusion.');
            alert('Pedido Salvo! (SweetAlert2 not available)'); // Fallback
          }
          
          console.log('Order saved successfully:', data);
        } else {
          throw new Error(data.message || 'Failed to save order');
        }
      } catch (error) {
        console.error('Error saving order:', error);
        
        // SweetAlert2 usage (assuming it's correctly loaded via CDN)
        if (window.Swal) {
          window.Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: `Erro ao salvar o pedido: ${error.message}`,
            confirmButtonColor: '#dc3545'
          });
        } else {
          console.warn('SweetAlert2 not loaded.  Check your CDN inclusion.');
          alert(`Erro ao salvar o pedido: ${error.message} (SweetAlert2 not available)`); // Fallback
        }
      } finally {
        this.isLoading = false;
      }
    },
    
    validateForm() {
      if (!this.selectedStatus || !this.selectedCustomer || !this.selectedSeller) {
        // SweetAlert2 usage (assuming it's correctly loaded via CDN)
        if (window.Swal) {
          window.Swal.fire({
            icon: 'warning',
            title: 'Campos Obrigatórios',
            text: 'Por favor, preencha todos os campos obrigatórios.',
            confirmButtonColor: '#ffc107'
          });
        } else {
          console.warn('SweetAlert2 not loaded.  Check your CDN inclusion.');
          alert('Por favor, preencha todos os campos obrigatórios. (SweetAlert2 not available)'); // Fallback
        }
        return false;
      }
      return true;
    },
    
    async fetchData() {
      try {
        const [statusResponse, customerResponse, sellerResponse, originResponse] = await Promise.all([
          fetch('/backend/controllers/orderController.php?getStatus=true'),
          fetch('/backend/controllers/clientController.php'),
          fetch('/backend/controllers/userController.php'),
          fetch('/backend/controllers/orderController.php?getOrigin=true')
        ]);

        if (!statusResponse.ok || !customerResponse.ok || !sellerResponse.ok || !originResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const [statusData, customerData, sellerData, originData] = await Promise.all([
          statusResponse.json(),
          customerResponse.json(),
          sellerResponse.json(),
          originResponse.json()
        ]);

        this.orderData = {
          ...this.orderData,
          status: statusData.status_list,
          customer: customerData.clients,
          seller: sellerData.data,
          origin: originData.origin_list
        };
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    },
    async fetchOrderData(orderId) {
      try {
        this.isLoading = true;
        // Fetch base data and order data in parallel
        const [baseDataResponse, orderResponse] = await Promise.all([
          this.fetchData(), // Fetch status, customer, seller, origin
          fetch(`/backend/controllers/orderController.php?id=${orderId}`) // Fetch specific order
        ]);

        const orderData = await orderResponse.json();

        if (orderData.status === 'success' && orderData.order) {
          const order = orderData.order;
          this.newOrder = {
            id: order.id,
            delivery_date: order.delivery_date,
          };
          this.selectedStatus = order.status_id;
          this.selectedCustomer = order.client_id;
          this.selectedSeller = order.employee_id;
          this.selectedOrigin = order.origin_id;
          this.orderData = {
            ...this.orderData,
            value: order.estimated_value,
            discount: order.discount,
            description: order.description,
            notes: order.notes,
          };
        } else {
          throw new Error(orderData.message || 'Failed to fetch order data');
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
        // SweetAlert2 usage (assuming it's correctly loaded via CDN)
        if (window.Swal) {
          window.Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: `Erro ao carregar os dados do pedido: ${error.message}`,
            confirmButtonColor: '#dc3545'
          });
        } else {
          console.warn('SweetAlert2 not loaded.  Check your CDN inclusion.');
          alert(`Erro ao carregar os dados do pedido: ${error.message} (SweetAlert2 not available)`);
        }
      } finally {
        this.isLoading = false;
      }
    },
    getCurrentDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hours = String(today.getHours()).padStart(2, '0');
      const minutes = String(today.getMinutes()).padStart(2, '0');
      this.currentDate = `${day}/${month}/${year} ${hours}:${minutes}`;
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

/* Fix for select dropdown text color */
.form-select {
  color: #333333 !important; /* Force text color */
  background-color: #ffffff;
}

.form-select option {
  color: #333333; /* Ensure dropdown options are visible */
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

.client-info {
  border-left: 3px solid #2f9e44;
  background-color: #f8f9fa;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}
</style>

