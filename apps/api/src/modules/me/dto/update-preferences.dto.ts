import { IsBoolean, IsOptional } from 'class-validator'

/**
 * 更新通知偏好（字段均可选，至少由业务层校验一项）。
 */
export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  notifySecurity?: boolean

  @IsOptional()
  @IsBoolean()
  notifyInvite?: boolean

  @IsOptional()
  @IsBoolean()
  notifyWeekly?: boolean
}
