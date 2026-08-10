import { IsBoolean, IsOptional } from 'class-validator'

/**
 * 更新安全开关（MFA / 空闲退出）。
 */
export class UpdateSecurityDto {
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean

  @IsOptional()
  @IsBoolean()
  idleLogout?: boolean
}
