<script>
export default {
  name: "Home",
  data() {
    return {
        usuarios: [
            { nome: 'Jéssica Pereira', imagem: '../../public/assets/images/usuario_template.png' },
            { nome: 'Clarissa Neuman', imagem: '../../public/assets/images/usuario_template.png' },
            { nome: 'Roberto Goulart', imagem: '../../public/assets/images/usuario_template.png' },
            { nome: 'Marcela Alberta', imagem: '../../public/assets/images/usuario_template.png' }
        ],
        infoVenda: {
            clientes: 35,
            compraram: 19,
            conversao: 54
        }
    };
  },
  methods: {
    iniciarFila() {
      setInterval(() => {
        this.usuarios.shift(); // Move o primeiro para o final
      }, 3000); // Altera a cada 3 segundos
    }
  },
  mounted() {
    this.iniciarFila(); // Inicia a rotação automática da fila
  }
};
</script>

<template>
  <section class="fila-container ms-4 me-4 d-flex justify-content-between">

    <div class="w-75">
      <h2 class="mb-2">A vez é de</h2>
      <transition-group name="fila" tag="div">
        <div v-for="(usuario, index) in usuarios" :key="usuario.nome" 
             class="usuario" 
             :class="[{ 'destaque': index === 0 }, 'mb-4']">
          <img :src="usuario.imagem" class="rounded-circle" alt="Usuário">
          <span>{{ usuario.nome }}</span>
        </div>
      </transition-group>
    </div>
    <div class="w-25">
      <button class="btn btn-outline-light botao-abrir p-4">Abrir pedido</button>
      <div class="info-venda">
          <p>Clientes: {{ infoVenda.clientes }}</p>
          <p>Compraram: {{ infoVenda.compraram }}</p>
          <p>Conversão: {{ infoVenda.conversao }}%</p>
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

</style>