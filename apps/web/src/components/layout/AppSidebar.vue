<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'
import { groupNavItems } from './nav'

const emit = defineEmits<{
  navigate: []
}>()

const route = useRoute()
const auth = useAuthStore()

const brandSub = computed(() => {
  const org = auth.user?.organization?.name?.trim()
  return `${org || '星海科技'} · 生产环境`
})

const groups = groupNavItems()

/**
 * 判断导航项是否为当前活跃路由。
 */
function isActive(navId: string): boolean {
  return route.meta.nav === navId
}

/**
 * 导航后通知父级（用于关闭移动端 Sheet）。
 */
function onNavigate(): void {
  emit('navigate')
}
</script>

<template>
  <aside
    class="flex h-full w-[var(--sidebar-w)] flex-col border-r border-border bg-background p-4"
  >
    <RouterLink
      to="/dashboard"
      class="mb-1 flex items-center gap-3 rounded-md px-2 pb-5 pt-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="onNavigate"
    >
      <div
        class="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground"
        aria-hidden="true"
      >
        N
      </div>
      <div class="min-w-0">
        <div class="truncate text-base font-semibold tracking-tight">
          星枢 NovaOps
        </div>
        <div class="mt-px truncate text-[11px] text-muted-foreground">
          {{ brandSub }}
        </div>
      </div>
    </RouterLink>

    <nav class="flex flex-1 flex-col gap-0.5" aria-label="主导航">
      <template v-for="g in groups" :key="g.group">
        <div
          class="px-3 pb-2 pt-4 text-[11px] uppercase tracking-[0.06em] text-muted-foreground"
        >
          {{ g.group }}
        </div>
        <RouterLink
          v-for="item in g.items"
          :key="item.id"
          :to="item.path"
          :class="
            cn(
              'flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
              isActive(item.id)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          "
          @click="onNavigate"
        >
          <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>
