import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由占位：真实鉴权守卫与业务页在 Stage 3+ 落地。
 * `/` 按登录态分流（当前脚手架无 token，默认进 /auth）。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const token = localStorage.getItem('novaops_access_token')
        return token ? '/dashboard' : '/auth'
      },
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthPlaceholderView.vue'),
      meta: { public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardPlaceholderView.vue'),
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersPlaceholderView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsPlaceholderView.vue'),
    },
  ],
})

export default router
