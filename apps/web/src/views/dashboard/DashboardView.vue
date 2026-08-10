<script setup lang="ts">
import axios from 'axios'
import { onMounted, ref, watch } from 'vue'
import {
  fetchDashboardActivities,
  fetchDashboardOverview,
} from '@/api/dashboard'
import ActivityList from '@/components/dashboard/ActivityList.vue'
import DashboardPageHead from '@/components/dashboard/DashboardPageHead.vue'
import KpiGrid from '@/components/dashboard/KpiGrid.vue'
import QuickActions from '@/components/dashboard/QuickActions.vue'
import TrafficChart from '@/components/dashboard/TrafficChart.vue'
import { Button } from '@/components/ui/button'
import type {
  DashboardActivity,
  DashboardOverview,
  DashboardRange,
} from '@/types/dashboard'

/**
 * 仪表盘页：对齐 design/dashboard.html。
 */
const range = ref<DashboardRange>('7d')
const overview = ref<DashboardOverview | null>(null)
const activities = ref<DashboardActivity[]>([])
const overviewLoading = ref(false)
const activitiesLoading = ref(false)
const overviewError = ref<string | null>(null)
const activitiesError = ref<string | null>(null)

/**
 * 提取接口错误文案。
 */
function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message
    if (typeof msg === 'string' && msg) return msg
  }
  return fallback
}

/**
 * 加载 overview；失败时保留上一份成功数据。
 */
async function loadOverview() {
  overviewLoading.value = true
  overviewError.value = null
  try {
    const res = await fetchDashboardOverview(range.value)
    if (res.code !== 0) {
      throw new Error(res.message || '加载失败')
    }
    overview.value = res.data
  } catch (error) {
    overviewError.value = errorMessage(error, '概览数据加载失败')
  } finally {
    overviewLoading.value = false
  }
}

/**
 * 加载最近动态。
 */
async function loadActivities() {
  activitiesLoading.value = true
  activitiesError.value = null
  try {
    const res = await fetchDashboardActivities(10)
    if (res.code !== 0) {
      throw new Error(res.message || '加载失败')
    }
    activities.value = res.data.items
  } catch (error) {
    activitiesError.value = errorMessage(error, '动态列表加载失败')
  } finally {
    activitiesLoading.value = false
  }
}

/**
 * 首次并行加载。
 */
async function loadAll() {
  await Promise.all([loadOverview(), loadActivities()])
}

onMounted(() => {
  void loadAll()
})

watch(range, () => {
  void loadOverview()
})
</script>

<template>
  <div class="flex flex-col">
    <DashboardPageHead v-model:range="range" />

    <div
      v-if="overviewError && !overview"
      class="mb-5 flex flex-col items-center gap-3 rounded-md border border-border py-12"
    >
      <p class="text-sm text-muted-foreground">{{ overviewError }}</p>
      <Button variant="outline" size="sm" @click="loadOverview">重试</Button>
    </div>
    <template v-else>
      <KpiGrid :overview="overview" :loading="overviewLoading" />
      <div class="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div class="relative">
          <TrafficChart :overview="overview" :loading="overviewLoading" />
          <div
            v-if="overviewError && overview"
            class="absolute inset-x-0 bottom-3 flex justify-center"
          >
            <Button variant="secondary" size="sm" @click="loadOverview">
              刷新失败，重试
            </Button>
          </div>
        </div>
        <ActivityList
          :items="activities"
          :loading="activitiesLoading"
          :error="activitiesError"
          @retry="loadActivities"
        />
      </div>
      <QuickActions />
    </template>
  </div>
</template>
