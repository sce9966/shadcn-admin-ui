/**
 * Dashboard 演示数据（对齐 design/dashboard.html）。
 */

export type DashboardRange = '7d' | '30d' | '90d'

export type DeltaTrend = 'up' | 'down' | 'neutral'

export interface OverviewMock {
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

export interface ActivityMock {
  id: string
  initial: string
  title: string
  subtitle: string
  occurredAt: string
  relativeTime: string
}

/**
 * 按时间范围返回的 KPI / 图表 mock。
 */
export const RANGE_OVERVIEW: Record<DashboardRange, OverviewMock> = {
  '7d': {
    range: '7d',
    caption: '近 7 天 · 按小时聚合',
    kpi: {
      activeMembers: 128,
      openTickets: 17,
      loginSuccessRate: 98.6,
      storageUsedTb: 2.4,
      storageQuotaTb: 5,
    },
    deltas: {
      activeMembers: { text: '较上周 +6', trend: 'up' },
      openTickets: { text: '较昨日 −3', trend: 'down' },
      loginSuccessRate: { text: '近 24 小时', trend: 'neutral' },
      storage: { text: '配额 5 TB', trend: 'neutral' },
    },
    chart: {
      labels: [
        '00',
        '02',
        '04',
        '06',
        '08',
        '10',
        '12',
        '14',
        '16',
        '18',
        '20',
        '22',
      ],
      values: [42, 55, 48, 62, 70, 58, 66, 74, 81, 69, 77, 88],
    },
  },
  '30d': {
    range: '30d',
    caption: '近 30 天 · 按日聚合',
    kpi: {
      activeMembers: 146,
      openTickets: 41,
      loginSuccessRate: 97.9,
      storageUsedTb: 2.6,
      storageQuotaTb: 5,
    },
    deltas: {
      activeMembers: { text: '较上月 +18', trend: 'up' },
      openTickets: { text: '较上周 +8', trend: 'up' },
      loginSuccessRate: { text: '近 30 天', trend: 'neutral' },
      storage: { text: '配额 5 TB', trend: 'neutral' },
    },
    chart: {
      labels: [
        'W1',
        'W1',
        'W2',
        'W2',
        'W3',
        'W3',
        'W4',
        'W4',
        'W5',
        'W5',
        '今',
        '今',
      ],
      values: [50, 48, 61, 57, 72, 68, 75, 70, 82, 78, 86, 91],
    },
  },
  '90d': {
    range: '90d',
    caption: '近 90 天 · 按周聚合',
    kpi: {
      activeMembers: 162,
      openTickets: 93,
      loginSuccessRate: 97.2,
      storageUsedTb: 2.9,
      storageQuotaTb: 5,
    },
    deltas: {
      activeMembers: { text: '较上季 +34', trend: 'up' },
      openTickets: { text: '较上月 +12', trend: 'up' },
      loginSuccessRate: { text: '近 90 天', trend: 'neutral' },
      storage: { text: '配额 5 TB', trend: 'neutral' },
    },
    chart: {
      labels: [
        'M1',
        'M1',
        'M1',
        'M2',
        'M2',
        'M2',
        'M3',
        'M3',
        'M3',
        '近',
        '近',
        '今',
      ],
      values: [40, 44, 52, 49, 58, 63, 60, 71, 76, 80, 84, 90],
    },
  },
}

/**
 * 最近动态 seed（相对时间固定，避免时钟漂移）。
 */
export const ACTIVITY_SEED: ActivityMock[] = [
  {
    id: '1',
    initial: '林',
    title: '林晓加入「运营」角色',
    subtitle: '由陈思远审批 · 14:22',
    occurredAt: '2026-08-10T01:10:00.000Z',
    relativeTime: '12 分钟前',
  },
  {
    id: '2',
    initial: '系',
    title: '生产 API 密钥轮换完成',
    subtitle: '密钥 sk_live_…8f2a · 自动任务',
    occurredAt: '2026-08-10T00:41:00.000Z',
    relativeTime: '41 分钟前',
  },
  {
    id: '3',
    initial: '周',
    title: '周明导出用户名单',
    subtitle: 'CSV · 128 行 · IP 10.2.18.44',
    occurredAt: '2026-08-09T23:22:00.000Z',
    relativeTime: '2 小时前',
  },
  {
    id: '4',
    initial: '安',
    title: '异地登录告警已关闭',
    subtitle: '账号 zhao@xinghai.cn · 已确认本人',
    occurredAt: '2026-08-09T08:00:00.000Z',
    relativeTime: '昨天',
  },
]
