<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 p-8">
    <div class="flex flex-col gap-2">
      <p class="text-sm text-muted-foreground">星枢 NovaOps · 脚手架占位</p>
      <h1 class="text-3xl font-semibold tracking-tight">用户管理</h1>
      <p class="text-muted-foreground">
        用户列表 / 邀请 / 启停将在 Stage 4 对齐
        <code class="text-foreground">design/users.html</code>
      </p>
    </div>
    <Button variant="outline" as-child>
      <RouterLink to="/dashboard">返回仪表盘</RouterLink>
    </Button>
  </main>
</template>
