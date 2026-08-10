/** 用户角色。 */
export type UserRole = 'admin' | 'ops' | 'viewer'

/** 用户状态。 */
export type UserStatus = 'active' | 'invited' | 'disabled'

/**
 * 成员列表项。
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
 * 列表筛选查询。
 */
export interface UserListQuery {
  keyword?: string
  role?: UserRole | 'all'
  status?: UserStatus | 'all'
  page?: number
  pageSize?: number
}
