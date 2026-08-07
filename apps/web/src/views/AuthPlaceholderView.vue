<script setup lang="ts">
import { onMounted, ref } from 'vue'
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
      <p class="text-sm text-muted-foreground">星枢 NovaOps · Auth 占位</p>
      <h1 class="text-3xl font-semibold tracking-tight">登录 / 注册</h1>
      <p class="text-muted-foreground">
        Auth 业务页由 AIL-35 对齐
        <code class="text-foreground">design/auth.html</code>。
        未登录访问后台会被路由守卫重定向至此。
      </p>
      <p class="text-sm">{{ healthMessage }}</p>
      <p class="text-xs text-muted-foreground">
        本地预览壳层：写入
        <code class="text-foreground">localStorage.novaops_access_token</code>
        ，或设置
        <code class="text-foreground">VITE_SHELL_DEV_BYPASS_AUTH=true</code>。
      </p>
    </div>
  </main>
</template>
