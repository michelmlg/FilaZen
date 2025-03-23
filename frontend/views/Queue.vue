<script>
export default {
  name: "Home",
  data() {
    return {
      usuarios: [],  // Inicialmente vazia, será preenchida com os dados da fila
      infoVenda: {
        clientes: 35,
        compraram: 19,
        conversao: 54
      },
      startIndex: 0,
      isUserFirst: false,
      userData: null,
      pedidos: []
    };
  },
  computed: {
    usuariosPaginados() {
      return this.usuarios.slice(this.startIndex, this.startIndex + 5);
    }
  },
  methods: {
    verificarFila() {
      this.obterFila();
      
      setInterval(() => {
        this.obterFila();
      }, 5000); // Altera a cada 3 segundos
    },

    descerUsuario() {
      if (this.startIndex < this.usuarios.length - 5) {
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
        const response = await fetch('/backend/controllers/queueController.php');  // Substitua pela URL correta do seu endpoint
        const data = await response.json();
        
        if (data.status === 'success') {
          if (data.status === 'success' && Array.isArray(data.queue)) {
            this.usuarios = data.queue; // Atualiza a lista de usuários com a fila
            this.isUserFirst = this.usuarios.length > 0 && this.usuarios[0].id+"" == this.userData.id;
            //console.log(this.isUserFirst);
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
    redirecionarParaPedido() {
      if (this.isUserFirst) {
        this.$router.push('/dashboard/register-order');
      }
    },
    async checkAuth() {
      try {
        const response = await fetch("/backend/controllers/authController.php", {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        if (!response.ok) throw new Error("Erro ao verificar autenticação");

        const data = await response.json();
        console.log(data);
        if (data.user_session) {
          this.userData = data.user_session;
        }
      } catch (error) {
        console.error("Erro na verificação de autenticação:", error);
      }
    },
  },
  async mounted() {
    await this.checkAuth();
    await this.verificarFila(); // Chama o método para obter a fila assim que o componente for montado
  }
};
</script>

<template>
  <section class="fila-container ms-2 me-2 d-flex justify-content-between">
    <div class="w-70 ms-4">
      <h2 class="mb-2">A vez é de</h2>
      <transition-group name="fila" tag="div">
        <div v-for="(usuario, index) in usuariosPaginados" :key="usuario.full_name" 
             class="usuario" 
             :class="[{ 'destaque': index === 0 }, 'mb-4']">
          <img :src="usuario.img_path || '../../public/assets/images/usuario_template.png'" class="rounded-circle" alt="Usuário">
          <span>{{ usuario.full_name }}</span>
        </div>
      </transition-group>
      <div class="d-flex justify-content-center position-absolute bottom-0 start-50 translate-middle-x mb-2">
          <button class="btn btn-outline-secondary btn-sm me-2" @click="descerUsuario">
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="btn btn-outline-secondary btn-sm ms-2" @click="subirUsuario">
            <i class="fa-solid fa-arrow-up"></i>
          </button>
        </div>
    </div>
  </section>
    <div class="ms-auto d-flex flex-column">
      <section class="info-section mt-5 pt-5 pb-5 pe-5 me-5 d-flex flex-column">
      <div class="d-flex flex-column align-items-center text-center">
          <i v-if="!isUserFirst" class="fa-solid fa-lock"></i>
          <button
            v-if="isUserFirst" 
            class="btn btn-lg btn-outline-secondary botao-abrir btn-big-padding mt-2" 
            @click="redirecionarParaPedido"> <!-- Chama a função para redirecionar -->
            Abrir pedido
          </button>
          <button 
            v-else
            class="btn btn-lg btn-outline-secondary botao-abrir btn-big-padding mt-2" 
            disabled> <!-- Chama a função para redirecionar -->
            Você não é o primeiro da fila!
          </button>
      </div>

      <div class="info-venda mt-2 text-center">
        <table class="table table-striped table-sm text-center">
          <tr>
            <td class="text-start">Clientes:</td>
            <td class="text-end">{{ infoVenda.clientes }}</td>
          </tr>
          <tr>
            <td class="text-start">Compraram:</td>
            <td class="text-end">{{ infoVenda.compraram }}</td>
          </tr>
          <tr>
            <td class="text-start">Conversão:</td>
            <td class="text-end">{{ infoVenda.conversao }}%</td>
          </tr>
        </table>
      </div>
      </section>
      <section class="meus-pedidos mt-5 pb-5 me-5 pe-5 d-flex flex-column align-items-end">
        <h3 class="text-center flex-grow-1 me-3">Meus pedidos</h3>
        <table class="table table-meus-pedidos">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pedido in pedidos" :key="pedido.ticket">
              <td>{{ pedido.ticket }}</td>
              <td>{{ pedido.cliente }}</td>
            </tr>
          </tbody>
        </table>
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
/* Estilização básica */
.fila-container {
  padding: 20px;
}


.usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.5s ease-in-out;
  opacity: 0.8;
}

/* Destaque do primeiro usuário */
.destaque {
  font-weight: bold;
  opacity: 1;
}

/* Tamanho padrão dos ícones */
.usuario img {
  width: 70px;
  height: 70px;
  transition: all 0.5s ease-in-out;
}

/* Ícone maior para o primeiro da fila */
.destaque img {
  width: 200px;
  height: 200px;
}


.usuario span{
  font-size: 1.5rem;
}
.destaque span{
  font-size: 3rem;
   background: linear-gradient(135deg, var(--secondaryVue), var(--primaryVue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Animação da fila subindo */
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

.table-meus-pedidos{
  border: 3px solid;
  border-color: aqua;
}

.btn-big-padding{
  padding-top: 2rem;
  padding-bottom: 2rem;
  padding-left: 4rem;
  padding-right: 4rem;
}

</style>
