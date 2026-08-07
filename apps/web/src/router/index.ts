import { createRouter, createWebHistory } from 'vue-router'
import { readAccessToken, isAuthBypassEnabled } from '@/lib/auth-token'
import { setupRouterGuards } from './guards'

/**
 * 应用路由：Auth 独立；业务页挂 AdminLayout。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/auth/AuthView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: () => {
            const ok = Boolean(readAccessToken()) || isAuthBypassEnabled()
            return ok ? '/dashboard' : '/auth'
          },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardPlaceholderView.vue'),
          meta: { title: '仪表盘', nav: 'dashboard' },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/UsersPlaceholderView.vue'),
          meta: { title: '用户管理', nav: 'users' },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsPlaceholderView.vue'),
          meta: { title: '个人设置', nav: 'settings' },
        },
      ],
    },
  ],
})

setupRouterGuards(router)

export default router
