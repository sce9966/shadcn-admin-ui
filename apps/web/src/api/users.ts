import type { ApiResponse } from './health'
import { http } from './http'
import type {
  UserListItem,
  UserListPage,
  UserListQuery,
  UserRole,
  UserStatus,
} from '@/types/users'

/**
 * 成员分页列表。
 */
export async function fetchUsersApi(query: UserListQuery = {}) {
  const params: Record<string, string | number> = {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
  }
  if (query.keyword?.trim()) {
    params.keyword = query.keyword.trim()
  }
  if (query.role && query.role !== 'all') {
    params.role = query.role
  }
  if (query.status && query.status !== 'all') {
    params.status = query.status
  }

  const { data } = await http.get<ApiResponse<UserListPage>>('/users', {
    params,
  })
  return data
}

/**
 * 邀请成员。
 */
export async function inviteUserApi(body: {
  email: string
  role: UserRole
  note?: string
}) {
  const { data } = await http.post<ApiResponse<UserListItem>>(
    '/users/invites',
    body,
  )
  return data
}

/**
 * 重发邀请。
 */
export async function resendInviteApi(id: string) {
  const { data } = await http.post<
    ApiResponse<{ id: string; email: string; inviteExpiresAt: string }>
  >(`/users/${id}/resend-invite`)
  return data
}

/**
 * 启停状态。
 */
export async function updateUserStatusApi(
  id: string,
  status: Extract<UserStatus, 'active' | 'disabled'>,
) {
  const { data } = await http.patch<ApiResponse<UserListItem>>(
    `/users/${id}/status`,
    { status },
  )
  return data
}
