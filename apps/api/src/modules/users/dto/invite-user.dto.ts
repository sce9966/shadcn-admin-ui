import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'

/**
 * 邀请成员。
 */
export class InviteUserDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string

  @IsIn(['admin', 'ops', 'viewer'])
  role!: 'admin' | 'ops' | 'viewer'

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(512)
  note?: string
}
