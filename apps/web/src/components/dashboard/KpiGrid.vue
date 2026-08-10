<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardOverview, DeltaTrend } from '@/types/dashboard'
import { cn } from '@/lib/utils'

/**
 * KPI 四卡网格。
 */
const props = defineProps<{
  overview: DashboardOverview | null
  loading?: boolean
}>()

/**
 * 趋势文案颜色。
 */
function trendClass(trend: DeltaTrend) {
  if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400'
  if (trend === 'down') return 'text-destructive'
  return 'text-muted-foreground'
}

const cards = [
  {
    key: 'active' as const,
    label: '活跃成员',
    value: () =>
      props.overview ? String(props.overview.kpi.activeMembers) : '',
    delta: () => props.overview?.deltas.activeMembers,
  },
  {
    key: 'tickets' as const,
    label: '待处理工单',
    value: () =>
      props.overview ? String(props.overview.kpi.openTickets) : '',
    delta: () => props.overview?.deltas.openTickets,
  },
  {
    key: 'login' as const,
    label: '登录成功率',
    value: () =>
      props.overview
        ? `${props.overview.kpi.loginSuccessRate.toFixed(1)}%`
        : '',
    delta: () => props.overview?.deltas.loginSuccessRate,
  },
  {
    key: 'storage' as const,
    label: '存储占用',
    value: () =>
      props.overview
        ? `${props.overview.kpi.storageUsedTb} TB`
        : '',
    delta: () => props.overview?.deltas.storage,
  },
]
</script>

<template>
  <section
    class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    aria-label="关键指标"
  >
    <template v-if="loading && !overview">
      <Card v-for="i in 4" :key="i">
        <CardContent class="flex flex-col gap-3 p-5">
          <Skeleton class="h-3 w-16" />
          <Skeleton class="h-9 w-24" />
          <Skeleton class="h-3 w-20" />
        </CardContent>
      </Card>
    </template>
    <Card v-for="card in cards" v-else :key="card.key">
      <CardContent class="p-5">
        <div class="mb-2.5 text-xs text-muted-foreground">
          {{ card.label }}
        </div>
        <div class="text-[32px] font-semibold tracking-tight tabular-nums leading-none">
          {{ card.value() }}
        </div>
        <div
          v-if="card.delta()"
          :class="cn('mt-2 text-xs', trendClass(card.delta()!.trend))"
        >
          {{ card.delta()!.text }}
        </div>
      </CardContent>
    </Card>
  </section>
</template>
