import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { UserRole } from '../../../entities/user.entity'
import type { AuthUserPayload } from '../../auth/interfaces/auth-user.interface'
import { ROLES_KEY } from '../decorators/roles.decorator'

/**
 * 校验当前用户角色是否满足 @Roles 要求。
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * @returns 是否允许访问
   */
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!roles?.length) {
      return true
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthUserPayload }>()
    const user = request.user
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('无权限执行此操作')
    }
    return true
  }
}
