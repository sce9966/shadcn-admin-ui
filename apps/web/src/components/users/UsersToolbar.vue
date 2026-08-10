<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * 成员列表筛选工具栏。
 */
const keyword = defineModel<string>('keyword', { required: true })
const role = defineModel<string>('role', { required: true })
const status = defineModel<string>('status', { required: true })

const emit = defineEmits<{
  query: []
  reset: []
  export: []
}>()
</script>

<template>
  <form
    class="flex flex-wrap items-end justify-between gap-4 border-b p-4"
    @submit.prevent="emit('query')"
  >
    <div class="flex flex-wrap items-end gap-3">
      <div class="flex min-w-[220px] flex-col gap-1.5">
        <Label for="user-search">关键词</Label>
        <Input
          id="user-search"
          v-model="keyword"
          type="search"
          placeholder="姓名或邮箱"
          autocomplete="off"
        />
      </div>
      <div class="flex min-w-[160px] flex-col gap-1.5">
        <Label>角色</Label>
        <Select v-model="role">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="admin">工作区管理员</SelectItem>
              <SelectItem value="ops">运营</SelectItem>
              <SelectItem value="viewer">只读观察者</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div class="flex min-w-[160px] flex-col gap-1.5">
        <Label>状态</Label>
        <Select v-model="status">
          <SelectTrigger class="w-[160px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="invited">待接受</SelectItem>
              <SelectItem value="disabled">已停用</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2">
        <Button type="submit" size="sm">查询</Button>
        <Button type="button" variant="secondary" size="sm" @click="emit('reset')">
          重置
        </Button>
      </div>
    </div>
    <Button type="button" variant="secondary" size="sm" @click="emit('export')">
      导出 CSV
    </Button>
  </form>
</template>
