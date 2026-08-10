<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardActivity } from '@/types/dashboard'

/**
 * 最近动态列表。
 */
defineProps<{
  items: DashboardActivity[]
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <Card class="min-h-[280px]">
    <CardHeader class="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
      <CardTitle class="text-base font-semibold">最近动态</CardTitle>
      <Button variant="ghost" size="sm" as-child>
        <RouterLink to="/users">查看全部</RouterLink>
      </Button>
    </CardHeader>
    <CardContent>
      <div v-if="loading && !items.length" class="flex flex-col gap-4">
        <div v-for="i in 4" :key="i" class="flex gap-3">
          <Skeleton class="size-9 shrink-0 rounded-full" />
          <div class="flex flex-1 flex-col gap-2">
            <Skeleton class="h-4 w-3/4" />
            <Skeleton class="h-3 w-1/2" />
          </div>
          <Skeleton class="h-3 w-12" />
        </div>
      </div>
      <div
        v-else-if="error"
        class="flex flex-col items-center gap-3 py-10 text-center"
      >
        <p class="text-sm text-muted-foreground">{{ error }}</p>
        <Button variant="outline" size="sm" @click="emit('retry')">
          重试
        </Button>
      </div>
      <p
        v-else-if="!items.length"
        class="py-10 text-center text-sm text-muted-foreground"
      >
        暂无最近动态
      </p>
      <div v-else class="flex flex-col">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          :class="[
            'grid grid-cols-[36px_1fr_auto] items-start gap-3 border-border py-3.5',
            index === 0 ? 'pt-0' : 'border-t',
            index === items.length - 1 ? 'pb-0' : '',
          ]"
        >
          <Avatar class="size-9">
            <AvatarFallback class="text-xs">{{ item.initial }}</AvatarFallback>
          </Avatar>
          <div class="min-w-0">
            <div class="text-sm font-medium">{{ item.title }}</div>
            <div class="mt-1 text-xs text-muted-foreground">
              {{ item.subtitle }}
            </div>
          </div>
          <span class="shrink-0 text-xs text-muted-foreground">
            {{ item.relativeTime }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
