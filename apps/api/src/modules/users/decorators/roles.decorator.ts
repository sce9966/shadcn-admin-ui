import { SetMetadata } from '@nestjs/common'
import type { UserRole } from '../../../entities/user.entity'

/** 角色元数据键。 */
export const ROLES_KEY = 'roles'

/**
 * 声明接口所需角色（任一匹配即可）。
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
