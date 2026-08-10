import { IsString, Matches, MaxLength, MinLength } from 'class-validator'

/**
 * 修改密码。
 */
export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, {
    message: '密码需至少 8 位，且同时包含字母与数字',
  })
  newPassword!: string
}
