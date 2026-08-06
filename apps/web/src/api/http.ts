import axios from 'axios'

/**
 * 统一 Axios 实例；开发环境默认走 Vite 代理 `/api`。
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('novaops_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
)
