<script>
import OrderHistory from './components/OrderHistoryForm.vue';

export default {
  name: "Orders",
  components: {OrderHistory},
  methods: {
    async fetchOrders(page = 1, search = '', perPage = 10) {
      this.isLoading = true;

      try {
        const params = new URLSearchParams({
          page: page,
          perPage: perPage,
          search: search
        });

        const response = await fetch(`/backend/controllers/orderController.php?${params.toString()}`);
        const data = await response.json();

        if (data.status === 'success') {

          console.log(data.orders);
          this.table.orders = data.orders;
          const pagination = data.pagination;

          this.table.pagination.totalPages = pagination.total_pages;
          this.table.pagination.totalItems = pagination.total_items;
          this.table.pagination.perPage = pagination.per_page;
          this.table.pagination.currentPage = pagination.current_page;
          this.table.isLoading = false;
        } else {
          this.table.orders = [];
          alert(result.message || 'Erro ao buscar pedidos');
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
        alert('Erro ao buscar pedidos');
      }
    },
    async changePage(page) {
      if (page < 1 || page > this.table.pagination.totalPages) {
        return;
      }
      this.table.pagination.currentPage = page;
      await this.fetchOrders(this.table.pagination.currentPage, this.table.pagination.search, this.table.pagination.perPage);
    },
    openOrderHistory(order) {
      this.updateModal.order = order;
      this.$nextTick(() => { // Aguarda o Vue atualizar o DOM
        const modalElement = document.getElementById('updateOrderModal');
        if (modalElement) {
          const modal = new bootstrap.Modal(modalElement);
          modal.show();
        } else {
          console.error("Modal não encontrado no DOM.");
        }
      });
    },
    async deleteOrder(order) {
      const confirmation = await Swal.fire({
        title: `Deletar Pedido #${order.id}?`,
        text: "Essa ação não pode ser desfeita!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Deletar',
        cancelButtonText: 'Cancelar'
      });

      if (!confirmation.isConfirmed) return;

      try {
        const response = await fetch(`${this.apiUrl}`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ order_id: order.id }),
        });

        if (!response.ok) {
          throw new Error(`Erro ao deletar pedido: ${response.statusText}`);
        }

        const result = await response.json();
        Swal.fire({
          title: 'Sucesso!',
          text: result.message,
          icon: 'success',
          confirmButtonText: 'OK'
        });

        this.fetchOrders(); // Atualiza lista após exclusão

      } catch (error) {
        Swal.fire({
          title: 'Erro!',
          text: error.message || 'Falha ao deletar o pedido.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    },
    viewOrder(order_id){
      this.$router.push({ 
            name: 'order', 
            params: { 
              id: order_id, 
            }
          });
    }
  },
  computed: {
    pageHasOrders() {
      return Array.isArray(this.table.orders) && this.table.orders.length > 0;
    }
  },
  data() {
    return {
      table: {
        pagination:{
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          perPage: 10,
          search: '',
        },
        orders: [],
        perPageOptions: [10, 25, 50, 100, 200],
        isLoading: true,
      },
      headers: [
        "Pedido #",
        "Cliente",
        "Data do Pedido",
        "Valor Total",
        "Status",
        "Ações",
      ]
    };
  },
  async mounted() {
    await this.fetchOrders();
  }
};
</script>

<template>
  <div class="d-flex justify-content-center align-items-center mt-4">
    <div class="card shadow-lg" style="width: 100%; margin-right: 4rem; margin-left: 4rem;">
      <div class="card-header text-center" style="background-color: var(--textVue); color: var(--secondaryVue)">
        <h3>Histórico de Pedidos</h3>
      </div>
      
      <div class="card-body">
        
        <div class="d-flex justify-content-end align-items-center flex-nowrap mb-4">
          <select class="btn border rounded me-2" v-model="table.pagination.perPage" @change="changePage(1)" style="border-color: var(--secondaryVue) !important; color: var(--secondaryVue) !important;">
            <option v-for="option in table.perPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
          <button class="btn btn-outline-secondary me-2" @click="changePage(table.pagination.currentPage)"><i class="fa fa-rotate-right"></i></button>
          <div class="input-group me-2" style="max-width: 200px;">
            <input type="text" class="form-control" v-model="table.pagination.search" placeholder="Buscar...">
            <button class="btn btn-outline-secondary" type="button" @click="changePage(table.page)"><i class="fa fa-search"></i></button>
          </div>

          <div class="btn-group me-2" role="group" aria-label="First group">
            <button type="button" :disabled="table.pagination.currentPage === 1" class="btn btn-outline-secondary" @click="changePage(1)">
              <i class="fa-solid fa-angles-left"></i>
            </button>
            <button type="button" :disabled="table.pagination.currentPage === 1" class="btn btn-outline-secondary" @click="changePage(table.pagination.currentPage - 1)">
              <i class="fa-solid fa-angle-left"></i>
            </button>
            <div type="text" class="btn btn-outline-secondary">{{ table.pagination.currentPage }}</div>
            <button type="button" :disabled="table.pagination.currentPage >= table.pagination.totalPages" class="btn btn-outline-secondary" @click="changePage(table.pagination.currentPage + 1)">
              <i class="fa-solid fa-angle-right"></i>
            </button>
          </div>

        </div>

        <div class="border rounded p-2 mt-2" style="border-color: var(--secondaryVue);">
          <table id="orders-table" class="table table-striped table-hover">
            <thead>
              <!-- {
                  "order_id": "1",
                  "status": "EM ATENDIMENTO",
                  "client_name": "Luca Giorgi",
                  "origin": "PRESENCIAL",
                  "seller_name": "Michel lisboa",
                  "description": "Cliente solicitou 250 unidades do piso ib\u00e9rico.",
                  "estimated_value": "14210.00",
                  "discount": "100.00",
                  "created_at": "2025-03-17 22:51:22",
                  "expected_delivery_date": "2025-03-17 00:00:00"
              } -->
              <tr>
                <th>#</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Origin</th>
                <th>Seller</th>
                <th>Valor Total</th>
                <th>Data do Pedido</th>
                <th>Data de entrega</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody v-if="table.isLoading">
              <tr>
                <td colspan="9">
                  <div class="d-flex justify-content-center align-items-center">
                    <span>Carregando...</span>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr v-if="!pageHasOrders">
                <td colspan="6">
                  <div class="d-flex justify-content-center align-items-center">
                    <span>Nenhum pedido encontrado na página</span>
                  </div>
                </td>
              </tr>
              <tr v-else v-for="(order, index) in table.orders" :key="order.order_id">
                <td>
                  <span class="bg-secondary fw-bold rounded ps-2 pe-2 text-light">
                    #{{ order.order_id }}
                  </span>
                </td>
                <td>{{ order.client_name }}</td>
                <td>{{ order.status }}</td>
                <td>{{ order.origin }}</td>
                <td>{{ order.seller_name }}</td>
                <td>{{ order.estimated_value }}</td>
                <td>{{ order.created_at }}</td>
                <td>{{ order.delivery_date }}</td>
                <td>
                  <button class="btn btn-secondary btn-sm rounded me-2" @click="viewOrder(order.order_id)">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button class="btn btn-danger btn-sm rounded me-2" @click="deleteOrder(order)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="table-footer">
            <small>
              Página {{ table.pagination.currentPage }} de {{ table.pagination.totalPages }}
            </small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
}
.bg-secondary {
  background-color: var(--secondaryVue) !important;
}
.btn-outline-secondary {
  color: var(--secondaryVue) !important;
  border-color: var(--secondaryVue) !important;
}
.btn-outline-secondary:hover {
  background-color: var(--secondaryVue) !important;
  color: var(--backgroundVue) !important;
  border-color: var(--secondaryVue) !important;
}
.card-header {
  padding: 1.5rem;
}
.card-body {
  padding: 1.5rem;
}
.table th, .table td {
  text-align: center;
  vertical-align: middle;
}
</style>
