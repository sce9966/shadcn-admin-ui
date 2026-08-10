<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  fetchUsersApi,
  inviteUserApi,
  resendInviteApi,
  updateUserStatusApi,
} from '@/api/users'
import InviteMemberSheet from '@/components/users/InviteMemberSheet.vue'
import UsersPagination from '@/components/users/UsersPagination.vue'
import UsersTable from '@/components/users/UsersTable.vue'
import UsersToolbar from '@/components/users/UsersToolbar.vue'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth'
import type { UserListItem, UserRole, UserStatus } from '@/types/users'

const auth = useAuthStore()
const canManage = computed(() => auth.user?.role === 'admin')

const loading = ref(false)
const inviteOpen = ref(false)
const inviteSheet = ref<InstanceType<typeof InviteMemberSheet> | null>(null)

const draft = reactive({
  keyword: '',
  role: 'all',
  status: 'all',
})

const applied = reactive({
  keyword: '',
  role: 'all' as UserRole | 'all',
  status: 'all' as UserStatus | 'all',
  page: 1,
  pageSize: 10,
})

const items = ref<UserListItem[]>([])
const total = ref(0)

/**
 * 从 Axios 错误提取 message。
 */
function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message
    if (typeof msg === 'string' && msg) return msg
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * 拉取列表。
 */
async function loadUsers(opts?: { toastCount?: boolean; resetToast?: boolean }) {
  loading.value = true
  try {
    const res = await fetchUsersApi({
      keyword: applied.keyword,
      role: applied.role,
      status: applied.status,
      page: applied.page,
      pageSize: applied.pageSize,
    })
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '加载失败')
    }
    items.value = res.data.items
    total.value = res.data.total
    if (opts?.toastCount) {
      toast.success(`已查询到 ${res.data.total} 名成员`)
    }
    if (opts?.resetToast) {
      toast.success('已重置筛选条件')
    }
  } catch (error) {
    toast.error(errorMessage(error, '加载成员列表失败'))
  } finally {
    loading.value = false
  }
}

/**
 * 应用筛选并查询。
 */
async function onQuery() {
  applied.keyword = draft.keyword.trim()
  applied.role = draft.role as UserRole | 'all'
  applied.status = draft.status as UserStatus | 'all'
  applied.page = 1
  await loadUsers({ toastCount: true })
}

/**
 * 重置筛选。
 */
async function onReset() {
  draft.keyword = ''
  draft.role = 'all'
  draft.status = 'all'
  applied.keyword = ''
  applied.role = 'all'
  applied.status = 'all'
  applied.page = 1
  await loadUsers({ resetToast: true })
}

/**
 * 导出演示。
 */
function onExport() {
  toast.success(`已导出 ${total.value} 名成员（演示）`)
}

/**
 * 翻页。
 */
async function onPageChange(page: number) {
  applied.page = page
  await loadUsers()
}

/**
 * 重发邀请。
 */
async function onResend(id: string) {
  try {
    const res = await resendInviteApi(id)
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '重发失败')
    }
    toast.success(`已向 ${res.data.email} 重发邀请`)
  } catch (error) {
    toast.error(errorMessage(error, '重发邀请失败'))
  }
}

/**
 * 启停切换。
 */
async function onToggle(item: UserListItem) {
  const next = item.status === 'disabled' ? 'active' : 'disabled'
  try {
    const res = await updateUserStatusApi(item.id, next)
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '操作失败')
    }
    toast.success(
      next === 'disabled' ? `已停用 ${item.name}` : `已启用 ${item.name}`,
    )
    await loadUsers()
  } catch (error) {
    toast.error(errorMessage(error, '更新状态失败'))
  }
}

/**
 * 提交邀请。
 */
async function onInvite(payload: {
  email: string
  role: UserRole
  note?: string
}) {
  try {
    const res = await inviteUserApi(payload)
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '邀请失败')
    }
    inviteSheet.value?.setSubmitting(false)
    inviteOpen.value = false
    toast.success(`邀请已发送至 ${payload.email}`)
    applied.page = 1
    await loadUsers()
  } catch (error) {
    inviteSheet.value?.setSubmitting(false)
    const msg = errorMessage(error, '邀请失败')
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 409
    ) {
      inviteSheet.value?.setEmailError(msg)
      return
    }
    toast.error(msg)
  }
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">成员与权限</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          管理本工作区账号、角色与访问状态。
        </p>
      </div>
      <Button v-if="canManage" type="button" @click="inviteOpen = true">
        邀请成员
      </Button>
    </div>

    <section class="overflow-hidden rounded-lg border bg-card shadow-sm">
      <UsersToolbar
        v-model:keyword="draft.keyword"
        v-model:role="draft.role"
        v-model:status="draft.status"
        @query="onQuery"
        @reset="onReset"
        @export="onExport"
      />
      <UsersTable
        :items="items"
        :loading="loading"
        :can-manage="canManage"
        :current-user-id="auth.user?.id"
        @resend="onResend"
        @toggle="onToggle"
      />
      <UsersPagination
        :page="applied.page"
        :page-size="applied.pageSize"
        :total="total"
        @update:page="onPageChange"
      />
    </section>

    <InviteMemberSheet
      v-if="canManage"
      ref="inviteSheet"
      v-model:open="inviteOpen"
      @submit="onInvite"
    />
  </div>
</template>
