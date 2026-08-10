<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

/** 会话已由 `main.ts` 中 `auth.bootstrap()` 完成初始化 */
const mobileOpen = ref(false)
</script>

<template>
  <div
    class="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[var(--sidebar-w)_1fr]"
  >
    <div class="sticky top-0 hidden h-screen lg:block">
      <AppSidebar />
    </div>

    <Sheet v-model:open="mobileOpen">
      <SheetContent side="left" class="w-[var(--sidebar-w)] p-0">
        <SheetHeader class="sr-only">
          <SheetTitle>导航菜单</SheetTitle>
          <SheetDescription>星枢 NovaOps 主导航</SheetDescription>
        </SheetHeader>
        <AppSidebar @navigate="mobileOpen = false" />
      </SheetContent>
    </Sheet>

    <div class="flex min-w-0 flex-col bg-muted/40">
      <AppTopbar @open-menu="mobileOpen = true" />
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
