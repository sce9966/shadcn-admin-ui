import type { Router } from 'vue-router'
import { isAuthBypassEnabled, readAccessToken } from '@/lib/auth-token'

/**
 * 注册全局路由守卫：受保护页需登录；已登录访问 /auth 则离开。
 */
export function setupRouterGuards(router: Router): void {
  router.beforeEach((to) => {
    const hasToken = Boolean(readAccessToken()) || isAuthBypassEnabled()
    const isPublic = to.matched.some((r) => r.meta.public === true)
    const requiresAuth = to.matched.some((r) => r.meta.requiresAuth === true)

    if (requiresAuth && !hasToken) {
      return {
        path: '/auth',
        query: { redirect: to.fullPath },
      }
    }

    if (isPublic && hasToken && to.name === 'auth') {
      const redirect = to.query.redirect
      if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('/auth')) {
        return redirect
      }
      return { name: 'dashboard' }
    }

    return true
  })
}
