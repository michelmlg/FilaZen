<template>
    <div v-if="orderData" class="modal fade" id="updateOrderModal" tabindex="-1" aria-labelledby="orderModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="orderModalLabel">{{ orderData.id ? 'Editar Pedido' : 'Adicionar Pedido' }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="submitForm">
                        <div class="mb-3">
                            <label for="orderId" class="form-label">ID do Pedido</label>
                            <input type="text" class="form-control" id="orderId" v-model="orderData.orderId" required>
                        </div>
                        <div class="mb-3">
                            <label for="orderDate" class="form-label">Data do Pedido</label>
                            <input type="date" class="form-control" id="orderDate" v-model="orderData.orderDate" required>
                        </div>
                        <div class="mb-3">
                            <label for="orderItems" class="form-label">Itens do Pedido</label>
                            <div class="d-flex gap-2">
                                <input type="text" class="form-control" v-model="modal.itemText">
                                <button type="button" class="btn btn-outline-success" @click="addItem"><i class="fa fa-plus"></i></button>
                            </div>
                            <div v-if="orderData.items.length != 0" class="input-group mb-2 mt-2">
                                <p class="m-0">Lista de Itens:</p>
                                <ul class="list-group w-100 rounded">
                                    <li v-for="(item, index) in orderData.items" :key="index" class="list-group-item">
                                        <div class="d-flex justify-content-between">
                                            <span>Item {{ index + 1 }}: {{ item }}</span>
                                            <button type="button" class="btn btn-sm btn-danger" @click="removeItem(index)"><i class="fa fa-trash"></i></button>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary" @click="submitForm">Salvar</button>
                </div>
            </div>
        </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "OrderHistoryForm",
    data() {
        return {
            modal: {
                itemText: null,
            },
            orderData: null
        };
    },
    methods: {
        addItem() {
            if (this.modal.itemText == null || this.modal.itemText === '') {
                return;
            }
            this.orderData.items.push(this.modal.itemText);
            this.modal.itemText = ''; // Limpar o input
        },
        removeItem(index) {
            this.orderData.items.splice(index, 1);
        },
        submitForm() {
            if (this.orderData.id) {
                this.updateOrder(this.orderData);
            } else {
                this.addOrder(this.orderData);
            }
        },
        async addOrder(orderData) {
            const data = await fetch("/backend/controllers/OrderController.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });
  
            const response = await data.json();
            console.log(response);
        },
        async updateOrder(orderData) {
            const data = await fetch(`/backend/controllers/OrderController.php?id=${orderData.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    order_id: orderData.id,
                    orderId: orderData.orderId,
                    orderDate: orderData.orderDate,
                    items: orderData.items,
                }),
            });
  
            const response = await data.json();
            console.log(response);
        }
    },
    async mounted() {
        await fetchOrders();
        //console.log("UpdateOrderForm:" + this.orderData);
    }
  };
  </script>
    
    <style scoped>
    .order-history-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      border-radius: 8px;
      transition: all 0.3s ease;
    }
    .card:hover {
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }
    .card-header {
      font-size: 1rem;
      background-color: #f8f9fa;
    }
    .btn-outline-primary {
      border-color: #007bff;
      color: #007bff;
    }
    .btn-outline-primary:hover {
      background-color: #007bff;
      color: white;
    }
    </style>
    