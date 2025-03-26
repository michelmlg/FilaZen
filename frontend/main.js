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

// Importar o roteador de forma assíncrona
import('./routes/index.js').then(({ default: router }) => {
    // Ajustar o caminho para carregar App.vue corretamente
    const App = defineAsyncComponent(() => loadModule('/frontend/App.vue', options));

    const app = createApp(App);
    app.use(router);

    app.config.globalProperties.$session = null;

    // Adiciona um beforeEach para verificar a sessão antes de cada navegação
    router.beforeEach(async (to, from, next) => {
        const session = await checkAuth();
        app.config.globalProperties.$session = session;

        if (!session && to.meta.requiresAuth) {
        next('/');
        } else {
        next();
        }
    });

    // Após a inicialização do app, montar no DOM
    app.mount("#app");

}).catch(err => console.error("Erro ao carregar roteador:", err));
