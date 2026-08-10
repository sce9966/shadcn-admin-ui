import { IsIn, IsOptional } from 'class-validator'
import type { DashboardRange } from '../data/dashboard-mock'

const RANGES = ['7d', '30d', '90d'] as const

/**
 * 仪表盘 overview 查询参数。
 */
export class OverviewQueryDto {
  @IsOptional()
  @IsIn(RANGES, { message: 'range 须为 7d、30d 或 90d' })
  range?: DashboardRange
}
