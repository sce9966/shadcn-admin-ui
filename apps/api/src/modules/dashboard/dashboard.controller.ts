import { Controller, Get, Query } from '@nestjs/common'
import { DashboardService } from './dashboard.service'
import { ActivitiesQueryDto } from './dto/activities-query.dto'
import { OverviewQueryDto } from './dto/overview-query.dto'

/**
 * 仪表盘只读 API。
 */
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * KPI + 图表。
   */
  @Get('overview')
  overview(@Query() query: OverviewQueryDto) {
    return this.dashboardService.getOverview(query.range ?? '7d')
  }

  /**
   * 最近动态。
   */
  @Get('activities')
  activities(@Query() query: ActivitiesQueryDto) {
    return this.dashboardService.getActivities(query.limit ?? 10)
  }
}
