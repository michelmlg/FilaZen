const { createRouter, createWebHashHistory } = VueRouter;
const { loadModule } = window['vue3-sfc-loader'];

const options = {
    moduleCache: {
        vue: Vue
    },
    getFile(url) {
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

// SOMENTE ALTERAR APÓS ESSE COMENTÁRIO

// Definir rotas dinamicamente com vue3-sfc-loader
const routes = [
    {
        path: "/",
        component: () => loadModule("/frontend/views/Home.vue", options),
    },
    {
        path: "/about",
        component: () => loadModule("/frontend/views/About.vue", options),
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
