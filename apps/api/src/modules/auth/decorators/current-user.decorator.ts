import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { AuthUserPayload } from '../interfaces/auth-user.interface'

/**
 * 从请求中提取当前登录用户。
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUserPayload }>()
    return request.user
  },
)
