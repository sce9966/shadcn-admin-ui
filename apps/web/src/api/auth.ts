import type { ApiResponse } from './health'
import type { AuthTokenData, AuthUser } from '@/types/auth'
import { http } from './http'

/**
 * 注册并创建工作区。
 */
export async function registerApi(body: {
  name: string
  orgName: string
  email: string
  password: string
}) {
  const { data } = await http.post<ApiResponse<AuthTokenData>>(
    '/auth/register',
    body,
  )
  return data
}

/**
 * 登录。
 */
export async function loginApi(body: {
  email: string
  password: string
  remember?: boolean
}) {
  const { data } = await http.post<ApiResponse<AuthTokenData>>(
    '/auth/login',
    body,
  )
  return data
}

/**
 * 登出。
 */
export async function logoutApi() {
  const { data } = await http.post<ApiResponse<{ ok: true }>>('/auth/logout')
  return data
}

/**
 * 当前用户。
 */
export async function fetchMeApi() {
  const { data } = await http.get<ApiResponse<AuthUser>>('/auth/me')
  return data
}
