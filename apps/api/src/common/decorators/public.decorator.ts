import { SetMetadata } from '@nestjs/common'

/** 标记为公开接口（跳过 JWT 守卫）。 */
export const IS_PUBLIC_KEY = 'isPublic'

/**
 * 将路由标记为无需登录。
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
