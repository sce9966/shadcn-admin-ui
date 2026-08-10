import { Transform } from 'class-transformer'
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

/**
 * 更新个人资料。
 */
export class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(64)
  name!: string

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(128)
  title!: string

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email!: string

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined
    return typeof value === 'string' ? value.trim() : value
  })
  @IsString()
  @MaxLength(500)
  bio?: string
}
