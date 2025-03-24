<template>
    <div class="container order-form-container mt-4">
    <div class="row">
    <div class="col-12 mb-4">
        <div class="d-flex justify-content-start p-2 align-items-center">
            <div class="me-2">
                Pedido: 
            </div>
            <div class="badge me-4 fw-bold fs-5" style="background-color: var(--textVue);">
                #3021
            </div>
            <small>
                abertura: 20/03/2025 - 17:43
            </small>
        </div>
        
    </div>
    </div>

    <div class="card rounded mb-4">
        <div class="card-header bg-light mb-3">
            <h5 class="mb-0">Classificação do Pedido</h5>
        </div>
        <div class="card-body p-3 rounded-bottom">
            <form class="order-form">
                <!-- Delivery Date -->
                <div class="row mb-4">
                    <!-- Status -->
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select form-select-lg shadow-sm" v-model="selectedStatus">
                            <option disabled value="null">Selecione um status</option>
                            <option v-for="status in orderData.status" :key="status.id" :value="status.id">
                                {{ status.name }}
                            </option>
                        </select>
                    </div>

                    <!-- Customer -->
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Cliente</label>
                        <select class="form-select form-select-lg shadow-sm" v-model="selectedCustomer">
                            <option disabled value="null">Selecione um cliente</option>
                            <option v-for="customer in orderData.customer" :key="customer.id" :value="customer.id">
                                {{ customer.name }}
                            </option>
                        </select>

                        <div v-if="selectedClient" class="client-info mt-2 p-2 border rounded bg-light">
                            <small class="d-block">CPF: {{ selectedClient.cpf }}</small>
                            <small class="d-block">Email: {{ selectedClient.email }}</small>
                        </div>
                    </div>


                    <!-- Seller -->
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Vendedor</label>
                        <select class="form-select form-select-lg shadow-sm" v-model="selectedSeller">
                            <option disabled value="null">Selecione um vendedor</option>
                            <option v-for="seller in orderData.seller" :key="seller.id" :value="seller.id">
                                {{ seller.full_name }}
                            </option>
                        </select>
                    </div>

                    <!-- Origin -->
                    <div class="col-md-3 mb-3">
                        <label class="form-label">Origem</label>
                        <select class="form-select form-select-lg shadow-sm" v-model="selectedOrigin">
                            <option disabled value="null">Selecione uma origem</option>
                            <option v-for="origin in orderData.origin" :key="origin.id" :value="origin.id">
                                {{ origin.name }}
                            </option>
                        </select>
                    </div>
                </div>


                    <!-- Submit Button -->
                <div class="d-flex justify-content-end mt-auto">
                    <button type="submit" class="btn btn-primary shadow">
                        <i class="fas fa-save me-2"></i> Atualizar
                    </button>
                </div>
                </form>
            </div>
        </div>

        
        <!-- Order Interactions -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-light">
                <h5 class="mb-0">Interações do pedido</h5>
            </div>
            <div class="card-body bg-secondary rounded-bottom overflow-auto"  style="min-height: 60vh; max-height: 80vh;">

                <div class="d-flex flex-column align-items-end mb-3">
                    <!-- Ajustando para alinhamento à esquerda e fixação no topo -->
                    <span class="text-white mb-1 text-start"> <i class="fa-solid fa-paper-plane"></i> 20/01/2025 - 12:30</span>
                    <div class="alert alert-secondary w-75">
                        <span class="fw-bold fs-6">Criado por:</span> João Silva <br>
                        A simple secondary alert—check it out!
                    </div>
                </div>
                <div class="d-flex flex-column align-items-end mb-3">
                    <!-- Ajustando para alinhamento à esquerda e fixação no topo -->
                    <span class="text-white mb-1 text-start"><i class="fa-solid fa-pen"></i> 20/01/2025 - 12:30</span>
                    <div class="alert alert-success w-75">
                        <span class="fw-bold fs-6">Criado por:</span> João Silva <br>
                        A simple secondary alert—check it out!
                    </div>
                </div>
                
            </div>
        </div>

        <!-- Order Interaction Form -->
        <div class="card shadow-sm mb-4 rounded">
            <div class="card-header">
                <h5 class="mb-0">Adicionar Interação</h5>
            </div>
        <div class="card-body rounded-bottom">

            <!-- Tabs for Message or Notes -->
            <ul class="nav nav-tabs" id="interactionTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <a class="nav-link active" id="message-tab" data-bs-toggle="tab" href="#message" role="tab" aria-controls="message" aria-selected="true">Mensagem</a>
            </li>
            <li class="nav-item" role="presentation">
                <a class="nav-link" id="notes-tab" data-bs-toggle="tab" href="#notes" role="tab" aria-controls="notes" aria-selected="false">Notas</a>
            </li>
            </ul>

            <div class="tab-content mt-3" id="interactionTabsContent">
            <!-- Message Form -->
            <div class="tab-pane fade show active" id="message" role="tabpanel" aria-labelledby="message-tab">
                <div class="form-group">
                    <form action="">
                        <label for="messageInput" class="form-label">Mensagem</label>
                        <textarea id="messageInput" v-model="orderData.message" class="form-control" rows="4" placeholder="Digite sua mensagem..."></textarea>
                        <button class="btn btn-sm text-light mt-2 mb-4" style="background-color: var(--textVue);">
                            <i class="fa-solid fa-paper-plane"></i> Adicionar Mensagem
                        </button>
                    </form>
                </div>
            </div>

            <!-- Notes Form -->
            <div class="tab-pane fade" id="notes" role="tabpanel" aria-labelledby="notes-tab">
                <div class="form-group">
                    <form action="">
                        <label for="notesInput" class="form-label">Notas</label>
                        <textarea id="notesInput" v-model="orderData.notes" class="form-control" rows="4" placeholder="Digite suas notas..."></textarea>
                        <button class="btn btn-sm text-light mt-2 mb-4" style="background-color: var(--textVue);">
                            <i class="fa-solid fa-pen"></i> Adicionar Nota
                        </button>
                    </form>
                </div>
            </div>
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
              <div class="col-md-3 mb-3">
                  <label class="form-label">Delivery Date</label>
                  <input type="date" 
                          v-model="newOrder.delivery_date" 
                          class="form-control shadow-sm" 
                          required>
              </div>
            </div>
          </div>
        </div>
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
        await this.fetchData(); // Only fetch data, no order creation
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
        async fetchData() {
            try {
                const [statusResponse, customerResponse, sellerResponse, originResponse, orderInteractions] = await Promise.all([
                fetch('/backend/controllers/orderController.php?getStatus=true'),
                fetch('/backend/controllers/clientController.php'),
                fetch('/backend/controllers/userController.php'),
                fetch('/backend/controllers/orderController.php?getOrigin=true'),
                fetch('/backend/controllers/orderController.php?getInteractions=true', {
                  method: 'GET',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ // Converte um objeto para JSON
                      order_id: this.$route.params.id,
                  })
                }),
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
                status: statusData.status_list || [],
                customer: customerData.clients || [],
                seller: sellerData.data || [],
                origin: originData.origin_list || []
                };
            } catch (error) {
                console.error('Error fetching data:', error);
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
  
  