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
