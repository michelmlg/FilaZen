import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import SelectTenantView from '@/views/SelectTenantView.vue'
import QueueSettingsView from '@/views/QueueSettingsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: AuthLayout,
      meta: { requiresGuest: true },
      children: [
        {
          path: '',
          component: LoginView,
        },
      ],
    },
    {
      path: '/register',
      name: 'register',
      component: AuthLayout,
      meta: { requiresGuest: true },
      children: [
        {
          path: '',
          component: RegisterView,
        },
      ],
    },
    {
      path: '/select-tenant',
      name: 'select-tenant',
      component: AuthLayout,
      meta: { requiresAuth: true, allowPendingTenants: true },
      children: [
        {
          path: '',
          component: SelectTenantView,
        },
      ],
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'queue',
          component: () => import('@/views/QueueView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
        {
          path: 'settings/queue',
          name: 'queue-settings',
          component: QueueSettingsView,
          meta: { requiresManager: true },
          props: (route) => ({ backTo: route.query.backTo as string | undefined }),
        },
        {
          path: 'tickets',
          name: 'tickets',
          component: () => import('@/views/TicketsView.vue'),
        },
        {
          path: 'tickets/create',
          name: 'create-ticket',
          component: () => import('@/views/CreateTicketView.vue'),
        },
        {
          path: 'customers',
          name: 'customers',
          component: () => import('@/views/CustomersView.vue'),
        },
        {
          path: 'team',
          name: 'team',
          component: () => import('@/views/TeamView.vue'),
          meta: { requiresAdmin: true },
        }
      ]
    }
  ],
})

router.beforeEach(async (to, _from) => {
  const auth = useAuthStore()

  if (auth.token && !auth.user) {
    await auth.checkAuth()
  }

  const isAuth = auth.isAuthenticated
  const hasPendingTenants = auth.pendingTenants.length > 0

  // Allow select-tenant route when user has pending tenants (no token yet)
  if (to.path === '/select-tenant' && hasPendingTenants) {
    return true
  }

  if (to.meta.requiresAuth && !isAuth) {
    return '/login'
  } else if (to.meta.requiresGuest && isAuth) {
    return '/'
  } else if (to.meta.requiresAdmin && !auth.isAdmin) {
    return '/'
  } else if (to.meta.requiresManager && !auth.isManager) {
    return '/'
  }
})

export default router
