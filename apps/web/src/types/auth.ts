/**
 * 当前登录用户视图。
 */
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'ops' | 'viewer'
  status: 'active' | 'invited' | 'disabled'
  title: string | null
  bio: string | null
  mfaEnabled: boolean
  idleLogout: boolean
  organization: {
    id: string
    name: string
  }
}

/**
 * 登录 / 注册成功响应。
 */
export interface AuthTokenData {
  accessToken: string
  expiresIn: number
  user: AuthUser
}

/**
 * 通知偏好。
 */
export interface UserPreferences {
  notifySecurity: boolean
  notifyInvite: boolean
  notifyWeekly: boolean
}

/**
 * 安全开关。
 */
export interface UserSecurity {
  mfaEnabled: boolean
  idleLogout: boolean
}

/**
 * 活动会话项。
 */
export interface SessionItem {
  id: string
  label: string
  ip: string | null
  isCurrent: boolean
  createdAt: string
}
