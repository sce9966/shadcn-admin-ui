<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Bell, Menu } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import AppUserMenu from './AppUserMenu.vue'
import ThemeToggle from './ThemeToggle.vue'

const emit = defineEmits<{
  openMenu: []
}>()

const route = useRoute()

const pageTitle = computed(() => {
  const title = route.meta.title
  return typeof title === 'string' && title ? title : '控制台'
})

/**
 * 通知铃铛占位 Toast（对齐原型文案）。
 */
function onNotify(): void {
  toast('有 3 条未读通知：2 条审批 · 1 条安全告警')
}
</script>

<template>
  <header
    class="flex h-[var(--topbar-h)] shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 lg:px-6"
  >
    <div class="flex min-w-0 items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="lg:hidden"
        aria-label="打开导航菜单"
        @click="emit('openMenu')"
      >
        <Menu aria-hidden="true" />
      </Button>
      <div class="flex min-w-0 flex-col justify-center gap-0.5">
        <Breadcrumb>
          <BreadcrumbList class="text-[11px]">
            <BreadcrumbItem>
              <BreadcrumbLink as-child>
                <RouterLink to="/dashboard">首页</RouterLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{{ pageTitle }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 class="truncate text-lg font-semibold tracking-tight">
          {{ pageTitle }}
        </h1>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1">
      <ThemeToggle />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="通知"
        @click="onNotify"
      >
        <Bell aria-hidden="true" />
      </Button>
      <AppUserMenu />
    </div>
  </header>
</template>
