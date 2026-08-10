import type { ApiResponse } from './health'
import type {
  AuthUser,
  SessionItem,
  UserPreferences,
  UserSecurity,
} from '@/types/auth'
import { http } from './http'

/**
 * 更新个人资料。
 */
export async function updateProfileApi(body: {
  name: string
  title: string
  email: string
  bio?: string
}) {
  const { data } = await http.patch<ApiResponse<AuthUser>>('/me/profile', body)
  return data
}

/**
 * 读取通知偏好。
 */
export async function fetchPreferencesApi() {
  const { data } = await http.get<ApiResponse<UserPreferences>>(
    '/me/preferences',
  )
  return data
}

/**
 * 更新通知偏好。
 */
export async function updatePreferencesApi(body: Partial<UserPreferences>) {
  const { data } = await http.patch<ApiResponse<UserPreferences>>(
    '/me/preferences',
    body,
  )
  return data
}

/**
 * 更新安全开关。
 */
export async function updateSecurityApi(body: Partial<UserSecurity>) {
  const { data } = await http.patch<ApiResponse<UserSecurity>>(
    '/me/security',
    body,
  )
  return data
}

/**
 * 修改密码。
 */
export async function changePasswordApi(body: {
  currentPassword: string
  newPassword: string
}) {
  const { data } = await http.post<ApiResponse<{ ok: true }>>(
    '/me/password',
    body,
  )
  return data
}

/**
 * 活动会话列表。
 */
export async function fetchSessionsApi() {
  const { data } = await http.get<ApiResponse<{ items: SessionItem[] }>>(
    '/me/sessions',
  )
  return data
}

/**
 * 撤销会话。
 */
export async function revokeSessionApi(id: string) {
  const { data } = await http.delete<ApiResponse<{ ok: true }>>(
    `/me/sessions/${id}`,
  )
  return data
}
