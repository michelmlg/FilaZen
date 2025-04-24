<script>
export default {
  name: "Home",
  data() {
    return {
      usuarios: [
      ],
      startIndex: 0, 
      isUserFirst: false,
      userData: this.$session,
      orders: [],
      ordersIsLoading: true,
      currentDate: new Date().toISOString().split('T')[0]
    };
  },
  computed: {
    usuariosPaginados() {
      return this.usuarios.slice(this.startIndex, this.startIndex + 4);
    }
  },
  methods: {
    verifyQueue() {
      this.getQueue();
      
      setInterval(() => {
        this.getQueue();
      }, 5000);
    },
    downUsersList() {      
      if (this.startIndex < this.usuarios.length - 3) {
        this.startIndex++;
      }
    },
    upUsersList() {      
      if (this.startIndex > 0) {
        this.startIndex--;
      }
    },
    async getQueue() {
      try {
        const response = await fetch('/backend/controllers/queueController.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ populate: true })
        });

        const data = await response.json();

        if (data.status === 'success' && Array.isArray(data.queue)) {
          this.usuarios = data.queue;
          this.isUserFirst = this.usuarios.length > 0 && String(this.usuarios[0].id) === String(this.userData.id);
        } else {
          console.error('Erro: a fila não é um array ou status não é success', data);
        }
      } catch (error) {
        console.error('Erro ao fazer requisição:', error);
      }
    },
    async getUserData() {
      try {
        const response = await fetch('/backend/controllers/userController.php?getUserData=true', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        const data = await response.json();
        if (data.status === 'success') {
          this.userData = data.userData;
        } else {
          console.error('Erro ao obter dados do usuário:', data.message);
        }
      } catch (error) {
        console.error('Erro ao fazer requisição:', error);
      }
    },
    async redirectToNewOrder() {
      if (this.isUserFirst) {
        const response = await fetch("/backend/controllers/orderController.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "openOrder",
          }),
          credentials: "include"
        });
        const data = await response.json(); // Parse the JSON response
        console.log(data);
        if (data.status === 'success' && data.id) {
          // this.$router.push("/dashboard/register-order", { query: id});

          this.$router.push({ 
            name: 'register-order', // Nome da rota
            query: { 
              id: data.id, // Parâmetro que você deseja passar
            }
          });
          //console.error("Failed to get order ID:", data);
        }else{
          alert("Failed to open order. Please try again.");
        }
      }
    },
    async fetchUserOrders() {
      try {
        const response = await fetch('/backend/controllers/orderController.php?getUserOrders=true', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });
        const data = await response.json();
        
        if (data.status === 'success') {
          this.orders = data.orders;
          this.ordersIsLoading = false;
        } else {
          console.error('Erro ao obter pedidos:', data.message);
        }
      } catch (error) {
        console.error('Erro ao fazer requisição:', error);
      }
    },
    viewOrder(order_id){
      this.$router.push({ 
            name: 'order', 
            params: { 
              id: order_id, 
            }
          });
    },
    formatDate(date) {
      if (!date) return "-";
      const d = new Date(date);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    },
    getStatusClass(status) {
      switch (status.toLowerCase()) {
        case "em atendimento":
          return "badge bg-warning text-dark";
        case "aberto":
          return "badge bg-success";
        case "aguardando terceiros":
          return "badge bg-danger";
        default:
          return "badge bg-secondary";
      }
    },
    calcDaysOpen(openDate, closeDate) {
      if (!openDate || !closeDate) return "Em aberto";

      const dataInicio = new Date(openDate);
      const dataFim = new Date(closeDate);
      
      const diffEmMilissegundos = dataFim - dataInicio;
      const diffEmDias = Math.ceil(diffEmMilissegundos / (1000 * 60 * 60 * 24));

      return diffEmDias + " dias";
    }
  },
  async mounted() {
    await this.verifyQueue();
    await this.fetchUserOrders();
  }
};
</script>

<template>
  <div class="main-container d-flex">
    <section class="left-section ms-2 me-2 d-flex flex-column">
      <div v-if="usuarios.length > 0" class="fila">
        <div class="w-70 ms-4">
          <h2 class="mb-2">A vez é de</h2>
          <transition-group name="fila" tag="div" style="height: 500px;">
            <div v-for="(usuario, index) in usuariosPaginados" :key="usuario.full_name" 
                 class="usuario" 
                 :class="[{ 'destaque': index === 0 }, 'mb-4']">
              <span>{{ startIndex + index + 1 }}º</span>
              <img :src="usuario.img_path || '../../public/assets/images/usuario_template.png'" class="rounded-circle" alt="Usuário">
              <span>{{ usuario.full_name }}</span>
            </div>
          </transition-group>
        </div>
        <div class="d-flex justify-content-start ms-4 mb-2 mt-4">
          <button class="btn btn-outline-secondary btn-sm me-2" @click="downUsersList">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm ms-2" @click="upUsersList">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      </div>
      <div v-else>
        <div  class="mt-4">
            <div class="w-50">
              <div class="alert alert-secondary">
                <h5 class="mt-2 text-muted">A fila está vazia...</h5>
              </div>
            </div>
        </div>
      </div>
    </section>

    <section class="right-section mt-4 d-flex flex-column justify-content-between">
      <div class="info-section d-flex flex-column" :class="{ 'destaque-usuario': isUserFirst }">
        <div class="d-flex flex-column align-items-center text-center">
          <i v-if="!isUserFirst" class="fa-solid fa-lock"></i>
          
          <button
            v-if="isUserFirst"
            class="btn btn-lg botao-abrir btn-big-padding mt-2 efeito-pulsante"
            @click="redirectToNewOrder">
            Abrir pedido!
          </button>

          <button 
            v-else
            class="btn btn-lg btn-outline-secondary botao-abrir btn-big-padding mt-2" 
            disabled>
            Você não é o primeiro da fila!
          </button>
        </div>

        <div class="d-flex justify-content-center align-items-center mt-4">
          <div class="card shadow-lg w-80">
            <div class="card-header text-center" style="background-color: var(--textVue); color: var(--secondaryVue)">
              <h3>Meus pedidos</h3>
            </div>
            
            <div class="card-body" style="max-height: 400px;">
  <div v-if="ordersIsLoading" class="text-center">
    <p>Carregando pedidos...</p>
  </div>
  <table v-else class="table table-striped table-hover m-0">
    <thead style="position: sticky; top: 0; background-color: white; z-index: 1;">
      <tr>
        <th><i class="fa-solid fa-ticket"></i> Ticket</th>
        <th>Status</th>
        <th>Cliente</th>
        <th>Data abertura</th>
      </tr>
    </thead>
  </table>
  <!-- Scroll aqui -->
  <div style="max-height: 300px; overflow-y: auto;">
    <table class="table table-striped table-hover m-0">
      <tbody>
        <tr v-if="!orders || orders.length === 0">
          <td colspan="4" class="text-center">Nenhum pedido encontrado.</td>
        </tr>
        <tr v-else v-for="order in orders" :key="order.id" class="order" @click="viewOrder(order.id)">
          <td><span class="badge bg-primary">#{{ order.id }}</span></td>
          <td><span :class="getStatusClass(order.status)">{{ order.status }}</span></td>
          <td>{{ order.client_name }}</td>
          <td>
            <span class="text-success">{{ formatDate(order.created_at) }}</span> - {{ calcDaysOpen(order.created_at, currentDate) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

          </div>
        </div>
      </div>


    </section>
  </div>
</template>

<style scoped>
:root {
  --textVue: #08545e;
  --backgroundVue: #d3dede;
  --primaryVue: #37be81;
  --primaryVueD:#237550;
  --secondaryVue: #1bb2d0;
  --secondaryVueD: #107185;
  --accentVue: #7270db;
}

.main-container {
  display: flex;
  justify-content: space-between;
  padding-left: 2rem;
  padding-right: 2rem;
}

.left-section {
  flex: 3;
  padding: 20px;
}

.right-section {
  flex: 3;
  padding: 20px;
}

.usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease-in-out;
  opacity: 0.8;
}

.destaque {
  font-weight: bold;
  opacity: 1;
}

.usuario img {
  width: 70px;
  height: 70px;
  transition: all 0.3s ease-in-out;
}

.destaque img {
  width: 200px;
  height: 200px;
}

.usuario span {
  font-size: 1.5rem;
}

.destaque span {
  font-size: 3rem;
  background: linear-gradient(135deg, var(--secondaryVue), var(--primaryVue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.fila-move {
  transition: transform 0.5s ease-out, opacity 0.5s ease-out;
}

.fila-enter-from, .fila-leave-to {
  opacity: 0;
  transform: translateY(-50px);
}

.fila-leave-active {
  position: absolute;
}

.btn-big-padding {
  padding-top: 2rem;
  padding-bottom: 2rem;
  padding-left: 4rem;
  padding-right: 4rem;
}

.botao-abrir {
  background: linear-gradient(135deg, var(--primaryVue), var(--secondaryVue));
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  transition: all 0.3s ease-in-out;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
}

.botao-abrir:hover {
  filter: brightness(1.2);
  transform: scale(1.05);
  box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.3);
}

.efeito-pulsante {
  animation: pulsar 1.5s infinite ease-in-out;
}

@keyframes pulsar {
  0% { transform: scale(1); }
  50% { transform: scale(1.08); }
  100% { transform: scale(1); }
}
.order {
  transition: transform 0.3s ease-in-out, background-color 0.3s ease-in-out;
}

.order:hover {
  cursor: pointer;
  background-color: var(--backgroundVue);
  transform: scale(1.03);
}

</style>