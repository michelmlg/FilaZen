<template>
    <div class="container">
        <div class=" mx-auto"> 
            <div id="orderInformation" class="card">
                <div class="card-header">
                    <h4 class="card-title">Informações do Pedido</h4>
                </div>
                <div class="card-body">
                    <div class="d-inline-flex">
                        <div class="col" id="orderNumber">
                            Número do Pedido: {{ orderData.orderNumber }}
                        </div>
                        <div class="col" id="currentDate">
                            Data do Pedido: {{ currentDate }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <form @submit.prevent="saveOrder">
            <div class="row">
                <div class="col-auto">
                    <label class="form-label">Status</label>
                    <select class="form-select" v-model="selectedStatus">
                        <option v-for="status in orderData.status" :key="status" :value="status">
                            {{ status }}
                        </option>
                    </select>
                </div>
                <div class="col-auto">
                    <label class="form-label">Cliente</label>
                    <select class="form-select" v-model="selectedCustomer">
                        <option v-for="customer in orderData.customer" :key="customer" :value="customer">
                            {{ customer }}
                        </option>
                    </select>
                </div>
                <div class="col-auto">
                    <label class="form-label">Vendedor</label>
                    <select class="form-select" v-model="selectedSeller">
                        <option v-for="seller in orderData.seller" :key="seller" :value="seller">
                            {{ seller }}
                        </option>
                    </select>
                </div>
                <div class="col-auto">
                    <label class="form-label">Origem</label>
                    <select class="form-select" v-model="selectedOrigin">
                        <option v-for="origin in orderData.origin" :key="origin" :value="origin">
                            {{ origin }}
                        </option>
                    </select>
                </div>
            </div>
            <div class="mb-3">
                <label for="description" class="form-label">Descrição:</label>
                <textarea
                    class="form-control"
                    id="description"
                    rows="4"
                    v-model="orderData.description"
                    placeholder="Enter description"
                ></textarea>
            </div>
            <div class="mb-3">
                <label for="notes" class="form-label">Notas:</label>
                <textarea
                    class="form-control"
                    id="notes"
                    rows="4"
                    v-model="orderData.notes"
                    placeholder="Enter description"
                ></textarea>
            </div>
            <div class="row mb-4">
                <div class="col-auto">
                    <label class="form-label">Status</label>
                    <input
                        type="number"
                        class="form-control"
                        v-model="orderData.value"
                        placeholder="Enter value"
                    />
                </div>
                <div class="col-auto">
                    <label class="form-label
                        ">Desconto</label>
                    <input
                        type="number"
                        class="form-control"
                        v-model="orderData.discount"
                        placeholder="Enter discount"
                    />
                </div>
            </div>
            <button type="submit" class="btn btn-primary w-100">
              <i></i> Salvar
            </button>
        </form>        
    </div>
    
</template>

<script>
    export default {
        data() {
            return {
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
            };
        },
        mounted() {
            this.getCurrentDate();
            this.orderData.orderDate = this.currentDate;
        },
         methods: {
            getCurrentDate() {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const hours = String(today.getHours()).padStart(2, '0');
            const minutes = String(today.getMinutes()).padStart(2, '0');
            this.currentDate = `${year}-${month}-${day} ${hours}:${minutes}`;
            },
            async saveOrder() {
                console.log(this.orderData);
                try {
                    const response = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(this.orderData)
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Order saved successfully:', data);
                    
                } catch (error) {
                    console.error('Error saving order:', error);
                    
                }
            },
            async fetchData() {
                try {
                    const statusResponse = await fetch('/api/status'); 
                    
                    const customerResponse = await fetch('/api/customers');

                    const sellerResponse = await fetch('/api/sellers');

                    const originResponse = await fetch('/api/origins'); 

                    if (!statusResponse.ok || !customerResponse.ok || !sellerResponse.ok || !originResponse.ok) {
                        throw new Error('Failed to fetch data');
                    }

                    const statusData = await statusResponse.json();
                    const customerData = await customerResponse.json();
                    const sellerData = await sellerResponse.json();
                    const originData = await originResponse.json();

                    this.orderData = {
                        ...this.orderData,
                        status: statusData,
                        customer: customerData,
                        seller: sellerData,
                        origin: originData
                    };
                } catch (error) {
                    console.error('Error fetching data:', error);
                    
                }
            }
        }
    }
</script>

