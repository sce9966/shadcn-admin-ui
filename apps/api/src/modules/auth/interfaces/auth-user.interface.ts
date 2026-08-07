import { UserRole, UserStatus } from '../../../entities/user.entity'

/**
 * 注入到请求上的当前用户摘要。
 */
export interface AuthUserPayload {
  id: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  title: string | null
  organizationId: string
  organizationName: string
  jti: string
}

/**
 * 对外返回的用户 DTO。
 */
export interface AuthUserView {
  id: string
  name: string
  email: string
  role: UserRole
  status: UserStatus
  title: string | null
  organization: {
    id: string
    name: string
  }
}

/**
 * 登录 / 注册成功响应。
 */
export interface AuthTokenResponse {
  accessToken: string
  expiresIn: number
  user: AuthUserView
}
