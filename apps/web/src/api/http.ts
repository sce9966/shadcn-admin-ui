import axios from 'axios'
import { clearAccessToken, readAccessToken } from '@/lib/auth-token'

/**
 * 统一 Axios 实例；开发环境默认走 Vite 代理 `/api`。
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = readAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status as number | undefined
    const url = String(error.config?.url ?? '')
    const skipSessionClear =
      url.includes('/auth/me') ||
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/logout')

    if (status === 401 && !skipSessionClear) {
      clearAccessToken()
      const path = window.location.pathname
      if (!path.startsWith('/auth')) {
        const redirect = encodeURIComponent(path + window.location.search)
        window.location.assign(`/auth?redirect=${redirect}`)
      }
    }

    return Promise.reject(error)
  },
)
