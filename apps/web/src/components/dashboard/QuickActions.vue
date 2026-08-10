<script setup lang="ts">
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

/**
 * 快捷操作区。
 */
const router = useRouter()

const actions = [
  {
    key: 'invite',
    title: '邀请成员',
    desc: '发送邮件邀请并预分配角色',
    run: () => router.push('/users'),
  },
  {
    key: 'export',
    title: '导出审计',
    desc: '下载近 30 天登录与权限变更',
    run: () => toast('导出审计即将推出（演示）'),
  },
  {
    key: 'security',
    title: '安全设置',
    desc: '开启 MFA 与会话超时策略',
    run: () => router.push('/settings'),
  },
]
</script>

<template>
  <Card>
    <CardHeader class="pb-2">
      <CardTitle class="text-base font-semibold">快捷操作</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          class="flex flex-col gap-2 rounded-md border border-border bg-card p-4 text-left transition-colors hover:border-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          @click="action.run()"
        >
          <span class="text-sm font-semibold">{{ action.title }}</span>
          <span class="text-xs text-muted-foreground">{{ action.desc }}</span>
        </button>
      </div>
    </CardContent>
  </Card>
</template>
