import type { UserRole, UserStatus } from '../../../entities/user.entity'

/**
 * 成员列表项（不含敏感字段）。
 */
export interface UserListItem {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  lastLoginAt: string | null
  createdAt: string
}

/**
 * 分页列表。
 */
export interface UserListPage {
  items: UserListItem[]
  total: number
  page: number
  pageSize: number
}

/**
 * 重发邀请结果。
 */
export interface ResendInviteResult {
  id: string
  email: string
  inviteExpiresAt: string
}
