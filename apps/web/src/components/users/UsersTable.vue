<script setup lang="ts">
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatLastLogin,
  nameInitial,
  roleLabel,
  statusLabel,
} from '@/lib/user-labels'
import type { UserListItem } from '@/types/users'

defineProps<{
  items: UserListItem[]
  loading: boolean
  canManage: boolean
  currentUserId?: string
}>()

const emit = defineEmits<{
  resend: [id: string]
  toggle: [item: UserListItem]
}>()

/**
 * 状态 Badge 变体。
 */
function statusVariant(status: UserListItem['status']) {
  if (status === 'active') return 'default' as const
  if (status === 'invited') return 'secondary' as const
  return 'outline' as const
}
</script>

<template>
  <div class="relative">
    <Table v-if="items.length || loading">
      <TableHeader>
        <TableRow>
          <TableHead>成员</TableHead>
          <TableHead>角色</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>最近登录</TableHead>
          <TableHead class="w-[200px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="item in items" :key="item.id">
          <TableCell>
            <div class="flex items-center gap-3">
              <Avatar class="size-9">
                <AvatarFallback>{{ nameInitial(item.name) }}</AvatarFallback>
              </Avatar>
              <div class="min-w-0">
                <div class="truncate font-medium">{{ item.name }}</div>
                <div class="truncate text-xs text-muted-foreground">
                  {{ item.email }}
                </div>
              </div>
            </div>
          </TableCell>
          <TableCell>{{ roleLabel(item.role) }}</TableCell>
          <TableCell>
            <Badge :variant="statusVariant(item.status)" class="gap-1.5">
              <span
                class="size-1.5 rounded-full"
                :class="{
                  'bg-emerald-500': item.status === 'active',
                  'bg-amber-500': item.status === 'invited',
                  'bg-muted-foreground': item.status === 'disabled',
                }"
              />
              {{ statusLabel(item.status) }}
            </Badge>
          </TableCell>
          <TableCell class="font-mono text-sm">
            {{ formatLastLogin(item.lastLoginAt) }}
          </TableCell>
          <TableCell>
            <div v-if="canManage" class="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="item.status !== 'invited'"
                @click="emit('resend', item.id)"
              >
                重发邀请
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                :disabled="item.id === currentUserId"
                @click="emit('toggle', item)"
              >
                {{ item.status === 'disabled' ? '启用' : '停用' }}
              </Button>
            </div>
            <span v-else class="text-sm text-muted-foreground">—</span>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <div
      v-if="!loading && !items.length"
      class="px-6 py-12 text-center text-sm text-muted-foreground"
    >
      没有符合条件的成员。
    </div>

    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-background/60 text-sm text-muted-foreground"
    >
      加载中…
    </div>
  </div>
</template>
