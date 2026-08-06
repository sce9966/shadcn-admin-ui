<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
    <div class="flex flex-col gap-2">
      <p class="text-sm text-muted-foreground">星枢 NovaOps · 脚手架占位</p>
      <h1 class="text-3xl font-semibold tracking-tight">仪表盘</h1>
      <p class="text-muted-foreground">
        Dashboard 将在 Stage 4 对齐
        <code class="text-foreground">design/dashboard.html</code>
      </p>
    </div>
    <nav class="flex flex-wrap gap-3">
      <Button variant="outline" as-child>
        <RouterLink to="/auth">Auth</RouterLink>
      </Button>
      <Button variant="outline" as-child>
        <RouterLink to="/users">用户管理</RouterLink>
      </Button>
      <Button variant="outline" as-child>
        <RouterLink to="/settings">个人设置</RouterLink>
      </Button>
    </nav>
  </main>
</template>
