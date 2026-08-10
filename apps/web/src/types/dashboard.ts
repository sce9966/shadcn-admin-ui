/**
 * 仪表盘时间范围。
 */
export type DashboardRange = '7d' | '30d' | '90d'

/**
 * KPI 变化趋势。
 */
export type DeltaTrend = 'up' | 'down' | 'neutral'

/**
 * overview 接口 data。
 */
export interface DashboardOverview {
  range: DashboardRange
  caption: string
  kpi: {
    activeMembers: number
    openTickets: number
    loginSuccessRate: number
    storageUsedTb: number
    storageQuotaTb: number
  }
  deltas: {
    activeMembers: { text: string; trend: DeltaTrend }
    openTickets: { text: string; trend: DeltaTrend }
    loginSuccessRate: { text: string; trend: DeltaTrend }
    storage: { text: string; trend: DeltaTrend }
  }
  chart: {
    labels: string[]
    values: number[]
  }
}

/**
 * 最近动态项。
 */
export interface DashboardActivity {
  id: string
  initial: string
  title: string
  subtitle: string
  occurredAt: string
  relativeTime: string
}

/**
 * activities 接口 data。
 */
export interface DashboardActivitiesData {
  items: DashboardActivity[]
}
