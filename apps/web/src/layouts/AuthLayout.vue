<script setup lang="ts">
/**
 * Auth 左右分栏布局（对齐 design/auth.html）。
 */
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div class="grid min-h-screen lg:grid-cols-[1fr_520px]">
      <aside
        class="relative hidden flex-col justify-between border-r border-border bg-[linear-gradient(160deg,color-mix(in_oklab,var(--foreground)_4%,transparent)_0%,var(--background)_48%,color-mix(in_oklab,var(--foreground)_3%,transparent)_100%)] p-16 lg:flex"
        aria-label="产品介绍"
      >
        <div>
          <p
            class="mb-5 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase"
          >
            Enterprise Console
          </p>
          <h1 class="mb-5 max-w-[12ch] text-5xl font-semibold tracking-tight">
            把运营与权限收进同一张桌面。
          </h1>
          <p class="max-w-[36ch] text-lg leading-relaxed text-muted-foreground">
            星枢为产品、运营与安全团队提供统一的中后台入口：仪表盘洞察、成员治理与账户安全一处完成。
          </p>
        </div>
        <div
          class="grid grid-cols-3 gap-6 border-t border-border pt-8"
        >
          <div>
            <div class="mb-2 font-mono text-xs text-muted-foreground">工作区</div>
            <div class="text-2xl font-semibold">12</div>
          </div>
          <div>
            <div class="mb-2 font-mono text-xs text-muted-foreground">角色模板</div>
            <div class="text-2xl font-semibold">6</div>
          </div>
          <div>
            <div class="mb-2 font-mono text-xs text-muted-foreground">审计保留</div>
            <div class="text-2xl font-semibold">90 天</div>
          </div>
        </div>
      </aside>

      <section class="flex flex-col justify-center px-6 py-10 sm:px-16">
        <div class="mb-10 flex items-center gap-3">
          <div
            class="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
            aria-hidden="true"
          >
            N
          </div>
          <div>
            <div class="font-semibold">星枢 NovaOps</div>
            <div class="text-sm text-muted-foreground">企业中后台</div>
          </div>
        </div>
        <slot />
      </section>
    </div>
  </div>
</template>
