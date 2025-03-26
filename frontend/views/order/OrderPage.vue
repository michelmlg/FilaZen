<template>
    <div class="container order-form-container mt-4">
    <div class="row">
    <div class="col-12 mb-4">
        <div class="d-flex justify-content-start p-2 align-items-center">
            <div class="me-2">
                Pedido: 
            </div>
            <div class="badge me-4 fw-bold fs-5" style="background-color: var(--textVue);">
                #{{ this.order.id }}
            </div>
            <small>
                abertura: {{ this.order.created_at }}
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
      <Interactions :interactions="this.order.interactions" :users="this.orderData.seller"></Interactions>

      <OrderInteractionForm @add-interaction="handleNewInteraction" :id="this.order.id"></OrderInteractionForm>


        

     <!-- Financial Information -->
     <FinancialData :order="order"></FinancialData>
    </div>
  </template>
  
  <script>
import FinancialData from './components/FinancialData.vue';
import Interactions from './components/Interactions.vue';
import OrderInteractionForm from './components/OrderInteractionForm.vue';



  export default {
    components:{
        Interactions, OrderInteractionForm, FinancialData
    },
    data() {
      return {
        selectedStatus: null,
        selectedCustomer: null,
        selectedSeller: null,
        selectedOrigin: null,
        selectedClient: null,
        order:{
          id: this.$route.params.id,
          created_at: null,
          interactions: null,
          estimated_value: 0,
          discount: 0,
          delivery_date: null,
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
        await this.fetchFormData(); 
        await this.fetchCurrentData();
        console.log(this.order.interactions);

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
        async fetchFormData() {
            try {
                const [statusResponse, customerResponse, sellerResponse, originResponse] = await Promise.all([
                fetch('/backend/controllers/orderController.php?getStatus=true'),
                fetch('/backend/controllers/clientController.php'),
                fetch('/backend/controllers/userController.php'),
                fetch('/backend/controllers/orderController.php?getOrigin=true'),
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
        async fetchCurrentData() {
          try {
              const [interactionResponse, orderResponse] = await Promise.all([
                  fetch('/backend/controllers/orderController.php', {
                      method: 'POST', // Ajustado para POST, já que está enviando um body
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ 
                          action: "getInteractions",
                          order_id: this.$route.params.id,
                      })
                  }),
                  fetch('/backend/controllers/orderController.php', {
                      method: 'POST', // Ajustado para POST
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                          action: "getOrder",
                          order_id: this.$route.params.id,
                      })
                  })
              ]);

              if (!interactionResponse.ok || !orderResponse.ok) {
                  throw new Error('Failed to fetch order data');
              }

              const [interactionData, orderData] = await Promise.all([
                  interactionResponse.json(),
                  orderResponse.json()
              ]);

              this.selectedCustomer = orderData.order.client_id;
              this.selectedOrigin = orderData.order.origin_id;
              this.selectedSeller = orderData.order.employee_id;
              this.selectedStatus = orderData.order.status_id;
              this.order.created_at = orderData.order.created_at;
              this.order.estimated_value = orderData.order.estimated_value;
              this.order.discount = orderData.order.discount;
              this.order.delivery_date = orderData.order.delivery_date;

              this.order.interactions = interactionData.interactions;

              
          } catch (error) {
              console.error('Error fetching order data:', error);
          }
        },
        async handleNewInteraction(interaction) {
          try {
            const response = await fetch("/backend/controllers/orderController.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(interaction),
            });

            if (!response.ok) {
              throw new Error("Erro ao enviar interação!");
            }

            const result = await response.json();
  
            this.order.interactions.push(result.interaction);
          } catch (error) {
            console.error("Erro:", error);
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
  
  