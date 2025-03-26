<template>
    <div class="card shadow-sm mb-4">
      <div class="card-header bg-light">
        <h5 class="mb-0">Informações Financeiras</h5>
      </div>
      <div class="card-body">
        <div class="row g-3"> <!-- Adicionado espaçamento uniforme -->
  
          <!-- Valor Estimado -->
          <div class="col-md-3">
            <label class="form-label">Valor Estimado</label>
            <div class="input-group">
              <span class="input-group-text">R$</span>
              <input
                type="number"
                step="0.01"
                class="form-control shadow-sm"
                :value="order.estimated_value"
                @input="updateOrder('value', $event.target.value)"
                placeholder="0.00"
              />
            </div>
          </div>
  
          <!-- Desconto -->
          <div class="col-md-3">
            <label class="form-label">Desconto</label>
            <div class="input-group">
              <span class="input-group-text">R$</span>
              <input
                type="number"
                step="0.01"
                class="form-control shadow-sm"
                :value="order.discount"
                @input="updateOrder('discount', $event.target.value)"
                placeholder="0.00"
              />
            </div>
          </div>
  
          <!-- Valor Final -->
          <div class="col-md-3">
            <label class="form-label">Valor Final</label>
            <div class="input-group">
              <span class="input-group-text">R$</span>
              <input
                type="text"
                class="form-control shadow-sm bg-light"
                :value="calculateFinalValue"
                disabled
              />
            </div>
          </div>
  
          <!-- Data de Entrega -->
          <div class="col-md-3">
            <label class="form-label">Data de Entrega</label>
            <input 
              type="date"
              class="form-control shadow-sm"
              :value="formattedDeliveryDate"
              @input="updateOrder('delivery_date', $event.target.value)"
              required
            />
          </div>
  
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      order: {
        type: Object,
        required: true
      }
    },
    computed: {
    calculateFinalValue() {
        return (this.order.estimated_value - this.order.discount).toFixed(2);
    },
    formattedDeliveryDate() {
        return this.order.delivery_date ? this.order.delivery_date.split(" ")[0] : "";
    }
    },
    methods: {
      updateOrder(field, value) {
        this.$emit("update:order", { ...this.order, [field]: value });
      }
    }
  };
  </script>
  