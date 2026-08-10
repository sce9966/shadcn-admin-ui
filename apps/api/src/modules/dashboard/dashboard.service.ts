import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ACTIVITY_SEED,
  RANGE_OVERVIEW,
  type DashboardRange,
  type OverviewMock,
} from './data/dashboard-mock'

/**
 * 仪表盘只读服务（首期全量 mock）。
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name)

  constructor(private readonly config: ConfigService) {}

  /**
   * 返回 KPI + 图表序列。
   */
  getOverview(range: DashboardRange = '7d'): OverviewMock {
    this.ensureMockMode()
    return RANGE_OVERVIEW[range]
  }

  /**
   * 返回最近动态列表。
   */
  getActivities(limit = 10) {
    this.ensureMockMode()
    const safeLimit = Math.min(Math.max(limit, 1), 50)
    return {
      items: ACTIVITY_SEED.slice(0, safeLimit),
    }
  }

  /**
   * 无真实上游时始终 mock；DASHBOARD_USE_MOCK=false 亦回落并告警。
   */
  private ensureMockMode() {
    const flag = this.config.get<string>('DASHBOARD_USE_MOCK', 'true')
    if (flag === 'false' || flag === '0') {
      this.logger.warn(
        'DASHBOARD_USE_MOCK=false 但无真实数据源，仍返回 mock 数据',
      )
    }
  }
}
