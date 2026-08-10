import { IsIn } from 'class-validator'

/**
 * 启停成员状态。
 */
export class UpdateUserStatusDto {
  @IsIn(['active', 'disabled'])
  status!: 'active' | 'disabled'
}
