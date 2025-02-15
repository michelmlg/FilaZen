const { createApp, defineAsyncComponent } = Vue;
const { loadModule } = window['vue3-sfc-loader'];

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
    app.mount("#app");

}).catch(err => console.error("Erro ao carregar roteador:", err));
