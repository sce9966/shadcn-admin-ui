<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { fetchHealth } from '@/api/health'

const healthMessage = ref('检测中…')

onMounted(async () => {
  try {
    const res = await fetchHealth()
    healthMessage.value =
      res.code === 0 ? `API 正常：${res.data.status}` : `API 异常：${res.message}`
  } catch {
    healthMessage.value = 'API 未连通（请先启动 pnpm dev:api）'
  }
})
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
    <div class="flex flex-col gap-2">
      <p class="text-sm text-muted-foreground">星枢 NovaOps · 脚手架占位</p>
      <h1 class="text-3xl font-semibold tracking-tight">登录 / 注册</h1>
      <p class="text-muted-foreground">
        Auth 业务页将在 Stage 3 对齐
        <code class="text-foreground">design/auth.html</code>
      </p>
      <p class="text-sm">{{ healthMessage }}</p>
    </div>
    <div class="flex flex-wrap gap-3">
      <Button as-child>
        <RouterLink to="/dashboard">进入仪表盘占位</RouterLink>
      </Button>
      <Button variant="outline" as-child>
        <RouterLink to="/users">用户管理占位</RouterLink>
      </Button>
    </div>
  </main>
</template>
