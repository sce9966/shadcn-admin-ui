import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

/**
 * 仪表盘最近动态查询参数。
 */
export class ActivitiesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number
}
