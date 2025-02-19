<script>
import Navbar from '../Components/Navbar.vue';

export default {
  name: "Home",
  components: { Navbar },
  data() {
    return {
      usuarios: [],  // Inicialmente vazia, será preenchida com os dados da fila
      infoVenda: {
        clientes: 35,
        compraram: 19,
        conversao: 54
      }
    };
  },
  methods: {
    verificarFila() {
      this.obterFila();
      
      setInterval(() => {
        this.obterFila();
      }, 5000); // Altera a cada 3 segundos
    },

    async obterFila() {
      try {
        const response = await fetch('/backend/controllers/queueController.php');  // Substitua pela URL correta do seu endpoint
        const data = await response.json();
        
        if (data.status === 'success') {
          this.usuarios = data.queue; // Atualiza a lista de usuários com a fila retornada
          //this.iniciarFila(); // Inicia a rotação da fila
        } else {
          console.error('Erro ao obter a fila: ', data.message);
        }
      } catch (error) {
        console.error('Erro ao fazer requisição:', error);
      }
    }
  },
  mounted() {
    this.verificarFila(); // Chama o método para obter a fila assim que o componente for montado
  }
};
</script>

<template>
  <Navbar></Navbar>
  <section class="fila-container ms-2 me-2 d-flex justify-content-between">
    <div class="w-70">
      <h2 class="mb-2">A vez é de</h2>
      <transition-group name="fila" tag="div">
        <div v-for="(usuario, index) in usuarios" :key="usuario.id" 
             class="usuario" 
             :class="[{ 'destaque': index === 0 }, 'mb-4']">
          <img :src="usuario.img_path || '../../public/assets/images/usuario_template.png'" class="rounded-circle" alt="Usuário">
          <span>{{ usuario.full_name }}</span>
        </div>
      </transition-group>
    </div>
    <div class="w-30">
      <div class="d-flex flex-column align-items-center">
          <i class="fa-solid fa-lock"></i>
          <button class="btn btn-lg btn-outline-secondary botao-abrir btn-big-padding mt-2">Abrir pedido</button>
      </div>

      <div class="info-venda">
        <table class="table table-striped">
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
    </div>
  </section>
</template>

<style scoped>
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

.btn-big-padding{
  padding-top: 2rem;
  padding-bottom: 2rem;
  padding-left: 4rem;
  padding-right: 4rem;
}

</style>
