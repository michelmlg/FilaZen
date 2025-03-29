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
      pedidos: [
      ],
    };
  },
  computed: {
    usuariosPaginados() {
      return this.usuarios.slice(this.startIndex, this.startIndex + 4);
    }
  },
  methods: {
    verificarFila() {
      this.obterFila();
      
      setInterval(() => {
        this.obterFila();
      }, 5000);
    },
    descerUsuario() {      
      if (this.startIndex < this.usuarios.length - 3) {
        this.startIndex++;
      }
    },
    subirUsuario() {      
      if (this.startIndex > 0) {
        this.startIndex--;
      }
    },
    async obterFila() {
      try {
        const response = await fetch('/backend/controllers/queueController.php');
        const data = await response.json();
        
        if (data.status === 'success') {
          if (data.status === 'success' && Array.isArray(data.queue)) {
            this.usuarios = data.queue;
            this.isUserFirst = this.usuarios.length > 0 && this.usuarios[0].id+"" == this.userData.id;
          } else {
            console.error('Erro: a fila não é um array ou status não é success', data);
          }
        } else {
          console.error('Erro ao obter a fila: ', data.message);
        }
      } catch (error) {
        console.error('Erro ao fazer requisição:', error);
      }
    },
    async redirecionarParaPedido() {
      if (this.isUserFirst) {
        const response = await fetch("/backend/controllers/orderController.php?action=open_order", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
        const data = await response.json(); // Parse the JSON response
        console.log(data);
        if (data.status === 'success' && data.data[0].id) {
          // this.$router.push("/dashboard/register-order", { query: id});

          this.$router.push({ 
            name: 'register-order', // Nome da rota
            query: { 
              id: data.data[0].id, // Parâmetro que você deseja passar
            }
          });
          //console.error("Failed to get order ID:", data);
        }else{
          alert("Failed to open order. Please try again.");
        }
      }
    },
  },
  async mounted() {
    await this.verificarFila();
  }
};
</script>

<template>
  <div class="main-container d-flex">
    <section class="left-section ms-2 me-2 d-flex flex-column">
      <div v-if="usuarios.length > 0" class="fila">
        <div class="w-70 ms-4">
          <h2 class="mb-2">A vez é de</h2>
          <transition-group name="fila" tag="div">
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
          <button class="btn btn-outline-secondary btn-sm me-2" @click="descerUsuario">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm ms-2" @click="subirUsuario">
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
            @click="redirecionarParaPedido">
            Abrir pedido!
          </button>

          <button 
            v-else
            class="btn btn-lg btn-outline-secondary botao-abrir btn-big-padding mt-2" 
            disabled>
            Você não é o primeiro da fila!
          </button>
        </div>
      </div>


      <div class="d-flex flex-column mt-4">
        <h3 class="text-center flex-grow-1 me-3">Meus pedidos</h3>
        <div class="text-center">
          <p>Carregando pedidos...</p>
        </div>
        <table  class="table table-meus-pedidos">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pedidos.length === 0">
              <td colspan="2" class="text-center">Nenhum pedido encontrado.</td>
            </tr>
            <tr v-for="pedido in pedidos" :key="pedido.ticket">
              <td>{{ pedido.ticket }}</td>
              <td>{{ pedido.cliente }}</td>
            </tr>
          </tbody>
        </table>
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
  flex: 1;
  padding: 20px;
}

.usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.5s ease-in-out;
  opacity: 0.8;
}

.destaque {
  font-weight: bold;
  opacity: 1;
}

.usuario img {
  width: 70px;
  height: 70px;
  transition: all 0.5s ease-in-out;
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
  transition: transform 0.9s ease-out, opacity 0.9s ease-out;
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


</style>