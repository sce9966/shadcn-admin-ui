import type { ApiResponse } from './health'
import type {
  DashboardActivitiesData,
  DashboardOverview,
  DashboardRange,
} from '@/types/dashboard'
import { http } from './http'

/**
 * 拉取仪表盘 overview（KPI + 图表）。
 */
export async function fetchDashboardOverview(range: DashboardRange = '7d') {
  const { data } = await http.get<ApiResponse<DashboardOverview>>(
    '/dashboard/overview',
    { params: { range } },
  )
  return data
}

/**
 * 拉取最近动态。
 */
export async function fetchDashboardActivities(limit = 10) {
  const { data } = await http.get<ApiResponse<DashboardActivitiesData>>(
    '/dashboard/activities',
    { params: { limit } },
  )
  return data
}
