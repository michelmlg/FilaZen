const { createApp, defineAsyncComponent } = Vue;
const { loadModule } = window['vue3-sfc-loader'];

// Função para verificar a autenticação
async function checkAuth() {
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
    return data.authenticated !== false ? data.user_session : null;
  } catch (error) {
    console.error("Erro na verificação de autenticação:", error);
    return null;
  }
}

// NAO ALTERE NADA DESSE ARQUIVO
const options = {
    moduleCache: {
        vue: Vue
    },
    getFile(url) {
        console.log("Carregando arquivo:", url);
        return fetch(url).then(res => res.ok ? res.text() : Promise.reject(`Erro ao carregar ${url}`));
    },
    addStyle(textContent) {
        const style = document.createElement('style');
        document.head.appendChild(style);
        style.textContent = textContent;
    },
    log(type, ...args) {
        console[type](...args);
    }
};

import('./routes/index.js').then(({ default: router }) => {
    const App = defineAsyncComponent(() => loadModule('/frontend/App.vue', options));

    const app = createApp(App);
    app.use(router);

    app.config.globalProperties.$session = null;

    app.config.globalProperties.aplicarMascaraTelefone = function(numero) {
      numero = numero.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    
      let numeroFormatado;
    
      // Se o número tiver 11 dígitos
      if (numero.length === 11) {
        numeroFormatado = numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } 
      // Se o número tiver 10 dígitos
      else if (numero.length === 10) {
        numeroFormatado = numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      } 
      // Caso não tenha 10 ou 11 dígitos, retorna o número sem máscara
      else {
        numeroFormatado = numero;
      }
    
      console.log("Número com máscara:", numeroFormatado); // Logando o número resultante da máscara
      return numeroFormatado;
    }
    
    

    router.beforeEach(async (to, from, next) => {
        const session = await checkAuth();
        app.config.globalProperties.$session = session;

        if (!session && to.meta.requiresAuth) {

          Swal.fire({
            title: 'Acesso Negado',
            text: 'Você precisa estar logado para acessar esta página.',
            icon: 'warning',
            showCancelButton: false, 
            showConfirmButton: false, 
            timer: 1000, 
            timerProgressBar: true,
          });

          setTimeout(() => {
            router.push("/login");
          }, 1000);
        } else {
          next();
        }
    });

    app.mount("#app");

}).catch(err => console.error("Erro ao carregar roteador:", err));
