import { Transform, Type } from 'class-transformer'
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator'

/**
 * 成员列表查询参数。
 */
export class ListUsersQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(128)
  keyword?: string

  @IsOptional()
  @IsIn(['admin', 'ops', 'viewer'])
  role?: 'admin' | 'ops' | 'viewer'

  @IsOptional()
  @IsIn(['active', 'invited', 'disabled'])
  status?: 'active' | 'invited' | 'disabled'

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10
}
