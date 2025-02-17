const { createRouter, createWebHashHistory } = VueRouter;
const { loadModule } = window['vue3-sfc-loader'];

const options = {
    moduleCache: {
        vue: Vue
    },
    getFile(url) {
        console.log("routes - carregando: " + url)
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
        component: () => loadModule("/frontend/views/LandingPage.vue", options),
    },
    {
        path: "/queue",
        component: () => loadModule("/frontend/views/Queue.vue", options),
    },
    {
        path: "/orders",
        component: () => loadModule("/frontend/views/Orders.vue", options),
    },
    {
        path: "/rules",
        component: () => loadModule("/frontend/views/Rules.vue", options),
    },
    {
        path: "/login",
        component: () => loadModule("/frontend/views/Login.vue", options),
    },
    {
        path: "/register",
        component: () => loadModule("/frontend/views/Register.vue", options),
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
