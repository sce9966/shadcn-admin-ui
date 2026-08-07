<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Settings } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const displayName = computed(() => auth.user?.name?.trim() || '访客')
const displayEmail = computed(() => auth.user?.email?.trim() || '—')
const avatarLetter = computed(() => {
  const name = displayName.value
  return name && name !== '访客' ? name.slice(0, 1) : '访'
})

/**
 * 跳转个人设置。
 */
function goSettings(): void {
  router.push('/settings')
}

/**
 * 退出登录并进入 Auth。
 */
async function onLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'auth' })
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="rounded-full"
        aria-label="用户菜单"
      >
        <Avatar class="size-8">
          <AvatarFallback class="text-xs font-semibold">
            {{ avatarLetter }}
          </AvatarFallback>
        </Avatar>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-56">
      <DropdownMenuLabel class="font-normal">
        <div class="flex flex-col gap-1">
          <span class="text-sm font-medium">{{ displayName }}</span>
          <span class="text-xs text-muted-foreground">{{ displayEmail }}</span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem @click="goSettings">
          <Settings />
          个人设置
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive" @click="onLogout">
        <LogOut />
        退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
