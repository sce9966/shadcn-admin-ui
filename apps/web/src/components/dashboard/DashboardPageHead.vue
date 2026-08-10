<script setup lang="ts">
import type { DashboardRange } from '@/types/dashboard'
import { cn } from '@/lib/utils'

/**
 * 仪表盘页头：标题 + 时间范围 pills。
 */
const props = defineProps<{
  range: DashboardRange
}>()

const emit = defineEmits<{
  'update:range': [value: DashboardRange]
}>()

const ranges: { value: DashboardRange; label: string }[] = [
  { value: '7d', label: '近 7 天' },
  { value: '30d', label: '近 30 天' },
  { value: '90d', label: '近 90 天' },
]
</script>

<template>
  <div class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">今日运营概览</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        生产环境 · 上海时区 · 数据截至刚才
      </p>
    </div>
    <div
      class="inline-flex gap-1 rounded-sm bg-muted/60 p-1"
      role="group"
      aria-label="时间范围"
    >
      <button
        v-for="item in ranges"
        :key="item.value"
        type="button"
        :class="
          cn(
            'h-7 rounded px-2.5 text-xs font-medium text-muted-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            props.range === item.value &&
              'bg-card text-foreground shadow-sm',
          )
        "
        :aria-pressed="props.range === item.value"
        @click="emit('update:range', item.value)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>
</template>
