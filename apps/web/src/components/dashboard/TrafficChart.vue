<script setup lang="ts">
import { computed } from 'vue'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardOverview } from '@/types/dashboard'
import { cn } from '@/lib/utils'

/**
 * 接口调用量 CSS 柱状图。
 */
const props = defineProps<{
  overview: DashboardOverview | null
  loading?: boolean
}>()

const maxValue = computed(() => {
  const values = props.overview?.chart.values ?? []
  return values.length ? Math.max(...values) : 1
})

/**
 * 柱高度百分比。
 */
function barPct(value: number) {
  return Math.round((value / maxValue.value) * 100)
}
</script>

<template>
  <Card class="min-h-[280px]">
    <CardHeader class="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
      <CardTitle class="text-base font-semibold">接口调用量</CardTitle>
      <span class="text-xs text-muted-foreground">
        {{ overview?.caption ?? '—' }}
      </span>
    </CardHeader>
    <CardContent>
      <div v-if="loading && !overview" class="flex h-[220px] flex-col gap-3 pt-2">
        <div class="grid h-full grid-cols-12 items-end gap-2">
          <Skeleton
            v-for="i in 12"
            :key="i"
            class="w-full rounded-t"
            :style="{ height: `${30 + (i % 5) * 12}%` }"
          />
        </div>
        <Skeleton class="h-3 w-full" />
      </div>
      <template v-else-if="overview">
        <div
          class="grid h-[220px] grid-cols-12 items-end gap-2 pt-2"
          aria-hidden="true"
        >
          <div
            v-for="(value, index) in overview.chart.values"
            :key="index"
            :title="String(value)"
            :class="
              cn(
                'min-h-2 rounded-t transition-colors',
                'bg-foreground/12 hover:bg-foreground',
                value === maxValue && 'bg-foreground',
              )
            "
            :style="{ height: `${barPct(value)}%` }"
          />
        </div>
        <div class="mt-2 grid grid-cols-12 gap-2">
          <span
            v-for="(label, index) in overview.chart.labels"
            :key="index"
            class="text-center font-mono text-[11px] text-muted-foreground"
          >
            {{ label }}
          </span>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
