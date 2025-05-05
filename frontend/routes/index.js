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
        path: "/login",
        component: () => loadModule("/frontend/views/Login.vue", options),
    },
    {
        path: "/register",
        component: () => loadModule("/frontend/views/Register.vue", options),
    },
    {
        path: "/confirm-email",
        component: () => loadModule("/frontend/views/EmailConfirmed.vue", options),
    },
    {
        path: "/dashboard",
        component: () => loadModule("/frontend/layouts/SystemLayout.vue", options),
        meta: { requiresAuth: true }, 
        children: [
            {
                path: 'queue', 
                component: () => loadModule("/frontend/views/Queue.vue", options),
                meta: { requiresAuth: true } 
            },
            {
                path: 'orders', 
                component: () => loadModule("/frontend/views/order_history/OrderHistoryPage.vue", options),
                meta: { requiresAuth: true } 
            },
            {
                path: 'order/:id', 
                name: 'order',
                component: () => loadModule("/frontend/views/order/OrderPage.vue", options),
                meta: { requiresAuth: true } 
            },
            {
                path: 'clients', 
                component: () => loadModule("/frontend/views/client_list/ClientListPage.vue", options),
                meta: { requiresAuth: true } 
            },
            {
                path: 'client/:id', 
                name: 'client-profile',
                component: () => loadModule("/frontend/views/client_profile/ClientProfilePage.vue", options),
                meta: { requiresAuth: true } 
            },
            {
                path: 'rules', 
                component: () => loadModule("/frontend/views/Rules.vue", options),
                meta: { requiresAuth: true } 
            },
            {
                path: 'register-order', 
                name: 'register-order',
                component: () => loadModule("/frontend/views/register_order/RegisterOrderPage.vue", options),
                meta: { requiresAuth: true } 
            },
        ]
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
