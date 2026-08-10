<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  changePasswordApi,
  fetchPreferencesApi,
  fetchSessionsApi,
  revokeSessionApi,
  updatePreferencesApi,
  updateProfileApi,
  updateSecurityApi,
} from '@/api/me'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import type { SessionItem, UserPreferences } from '@/types/auth'

type SettingsTab = 'profile' | 'notify' | 'security'

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'profile', label: '个人资料' },
  { id: 'notify', label: '通知偏好' },
  { id: 'security', label: '登录安全' },
]

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const savingProfile = ref(false)
const savingNotify = ref(false)
const savingPassword = ref(false)

const activeTab = computed<SettingsTab>(() => {
  const tab = String(route.query.tab || 'profile')
  if (tab === 'notify' || tab === 'security') return tab
  return 'profile'
})

const profileForm = reactive({
  name: '',
  title: '',
  email: '',
  bio: '',
})
const profileSnapshot = reactive({
  name: '',
  title: '',
  email: '',
  bio: '',
})
const profileErrors = reactive({
  name: false,
  title: false,
  email: false,
})

const notifyForm = reactive<UserPreferences>({
  notifySecurity: true,
  notifyInvite: true,
  notifyWeekly: false,
})

const mfaEnabled = ref(false)
const idleLogout = ref(true)
const passwordForm = reactive({
  current: '',
  next: '',
  confirm: '',
})
const passwordErrors = reactive({
  current: false,
  next: false,
  confirm: false,
})

const sessions = ref<SessionItem[]>([])

/**
 * 切换设置分区。
 */
function setTab(tab: SettingsTab) {
  void router.replace({ query: { ...route.query, tab } })
}

/**
 * 基础邮箱校验。
 */
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * 提取业务错误文案。
 */
function extractErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * 相对时间文案。
 */
function formatRelative(iso: string) {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  return `${days} 天前`
}

/**
 * 将用户写入资料表单快照。
 */
function applyUserToProfile() {
  const u = auth.user
  if (!u) return
  profileForm.name = u.name
  profileForm.title = u.title ?? ''
  profileForm.email = u.email
  profileForm.bio = u.bio ?? ''
  Object.assign(profileSnapshot, { ...profileForm })
  mfaEnabled.value = Boolean(u.mfaEnabled)
  idleLogout.value = u.idleLogout !== false
}

/**
 * 加载设置页数据。
 */
async function loadAll() {
  loading.value = true
  try {
    await auth.fetchMe()
    applyUserToProfile()

    const [prefRes, sessionRes] = await Promise.all([
      fetchPreferencesApi(),
      fetchSessionsApi(),
    ])
    if (prefRes.code === 0 && prefRes.data) {
      Object.assign(notifyForm, prefRes.data)
    }
    if (sessionRes.code === 0 && sessionRes.data) {
      sessions.value = sessionRes.data.items
    }
  } catch (error) {
    toast.error(extractErrorMessage(error, '加载设置失败'))
  } finally {
    loading.value = false
  }
}

/**
 * 重置资料表单。
 */
function resetProfile() {
  Object.assign(profileForm, { ...profileSnapshot })
  profileErrors.name = false
  profileErrors.title = false
  profileErrors.email = false
}

/**
 * 保存资料。
 */
async function onSaveProfile(event: Event) {
  event.preventDefault()
  const nameBad = profileForm.name.trim().length < 2
  const titleBad = profileForm.title.trim().length < 2
  const emailBad = !isEmail(profileForm.email)
  profileErrors.name = nameBad
  profileErrors.title = titleBad
  profileErrors.email = emailBad
  if (nameBad || titleBad || emailBad) {
    toast.error('请修正标红字段')
    return
  }

  savingProfile.value = true
  try {
    const res = await updateProfileApi({
      name: profileForm.name.trim(),
      title: profileForm.title.trim(),
      email: profileForm.email.trim(),
      bio: profileForm.bio.trim(),
    })
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '保存失败')
    }
    auth.setUser(res.data)
    applyUserToProfile()
    toast.success('个人资料已保存')
  } catch (error) {
    toast.error(extractErrorMessage(error, '保存资料失败'))
  } finally {
    savingProfile.value = false
  }
}

/**
 * 保存通知偏好。
 */
async function onSaveNotify() {
  savingNotify.value = true
  try {
    const res = await updatePreferencesApi({ ...notifyForm })
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '保存失败')
    }
    Object.assign(notifyForm, res.data)
    const on = [
      notifyForm.notifySecurity && '安全告警',
      notifyForm.notifyInvite && '邀请结果',
      notifyForm.notifyWeekly && '周报',
    ].filter(Boolean)
    toast.success(on.length ? `已开启：${on.join('、')}` : '已关闭全部邮件通知')
  } catch (error) {
    toast.error(extractErrorMessage(error, '保存通知设置失败'))
  } finally {
    savingNotify.value = false
  }
}

/**
 * 切换 MFA。
 */
async function onToggleMfa(checked: boolean) {
  const prev = mfaEnabled.value
  mfaEnabled.value = checked
  try {
    const res = await updateSecurityApi({ mfaEnabled: checked })
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '更新失败')
    }
    auth.patchUser({ mfaEnabled: res.data.mfaEnabled })
    toast.success(
      checked
        ? '请使用身份验证器完成 MFA 绑定（演示）'
        : '已关闭双因素认证',
    )
  } catch (error) {
    mfaEnabled.value = prev
    toast.error(extractErrorMessage(error, '更新 MFA 失败'))
  }
}

/**
 * 切换空闲退出。
 */
async function onToggleIdle(checked: boolean) {
  const prev = idleLogout.value
  idleLogout.value = checked
  try {
    const res = await updateSecurityApi({ idleLogout: checked })
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '更新失败')
    }
    auth.patchUser({ idleLogout: res.data.idleLogout })
    toast.success(checked ? '已开启空闲自动退出' : '已关闭空闲自动退出')
  } catch (error) {
    idleLogout.value = prev
    toast.error(extractErrorMessage(error, '更新失败'))
  }
}

/**
 * 更新密码并强制重新登录。
 */
async function onChangePassword(event: Event) {
  event.preventDefault()
  const currentBad = passwordForm.current.length < 1
  const nextBad = !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(passwordForm.next)
  const confirmBad =
    !passwordForm.confirm || passwordForm.confirm !== passwordForm.next
  passwordErrors.current = currentBad
  passwordErrors.next = nextBad
  passwordErrors.confirm = confirmBad
  if (currentBad || nextBad || confirmBad) {
    toast.error('密码未通过校验')
    return
  }

  savingPassword.value = true
  try {
    const res = await changePasswordApi({
      currentPassword: passwordForm.current,
      newPassword: passwordForm.next,
    })
    if (res.code !== 0) {
      throw new Error(res.message || '改密失败')
    }
    toast.success('密码已更新，请重新登录')
    auth.clearSession()
    await router.replace('/auth')
  } catch (error) {
    toast.error(extractErrorMessage(error, '更新密码失败'))
  } finally {
    savingPassword.value = false
  }
}

/**
 * 撤销会话。
 */
async function onRevokeSession(item: SessionItem) {
  try {
    const res = await revokeSessionApi(item.id)
    if (res.code !== 0) {
      throw new Error(res.message || '撤销失败')
    }
    sessions.value = sessions.value.filter((s) => s.id !== item.id)
    toast.success('已撤销该会话')
  } catch (error) {
    toast.error(extractErrorMessage(error, '撤销会话失败'))
  }
}

watch(
  () => auth.user,
  () => {
    if (!loading.value) applyUserToProfile()
  },
)

onMounted(() => {
  void loadAll()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">账户与偏好</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        管理个人资料、通知与登录安全。
      </p>
    </div>

    <div
      v-if="loading"
      class="text-sm text-muted-foreground"
    >
      加载中…
    </div>

    <div
      v-else
      class="grid items-start gap-5 lg:grid-cols-[220px_1fr]"
    >
      <nav
        class="flex flex-col gap-1 rounded-lg border bg-card p-2"
        aria-label="设置分区"
      >
        <button
          v-for="item in TABS"
          :key="item.id"
          type="button"
          :class="
            cn(
              'h-9 rounded-md px-3 text-left text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          "
          @click="setTab(item.id)"
        >
          {{ item.label }}
        </button>
      </nav>

      <div>
        <!-- 个人资料 -->
        <Card v-show="activeTab === 'profile'">
          <CardHeader>
            <CardTitle>个人资料</CardTitle>
            <CardDescription>对工作区内其他成员可见</CardDescription>
          </CardHeader>
          <form @submit="onSaveProfile">
            <CardContent class="grid gap-4 sm:grid-cols-2">
              <div class="flex flex-col gap-2">
                <Label for="profile-name">显示名称</Label>
                <Input
                  id="profile-name"
                  v-model="profileForm.name"
                  :aria-invalid="profileErrors.name"
                />
                <p
                  v-if="profileErrors.name"
                  class="text-xs text-destructive"
                >
                  名称至少 2 个字符
                </p>
              </div>
              <div class="flex flex-col gap-2">
                <Label for="profile-title">职位</Label>
                <Input
                  id="profile-title"
                  v-model="profileForm.title"
                  :aria-invalid="profileErrors.title"
                />
                <p
                  v-if="profileErrors.title"
                  class="text-xs text-destructive"
                >
                  请填写职位
                </p>
              </div>
              <div class="flex flex-col gap-2 sm:col-span-2">
                <Label for="profile-email">工作邮箱</Label>
                <Input
                  id="profile-email"
                  v-model="profileForm.email"
                  type="email"
                  :aria-invalid="profileErrors.email"
                />
                <p
                  v-if="profileErrors.email"
                  class="text-xs text-destructive"
                >
                  请输入有效邮箱
                </p>
              </div>
              <div class="flex flex-col gap-2 sm:col-span-2">
                <Label for="profile-bio">简介</Label>
                <Textarea
                  id="profile-bio"
                  v-model="profileForm.bio"
                  rows="3"
                  placeholder="一句话介绍你在团队中的职责"
                />
              </div>
            </CardContent>
            <CardFooter class="justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="secondary"
                @click="resetProfile"
              >
                重置
              </Button>
              <Button
                type="submit"
                :disabled="savingProfile"
              >
                保存资料
              </Button>
            </CardFooter>
          </form>
        </Card>

        <!-- 通知偏好 -->
        <Card v-show="activeTab === 'notify'">
          <CardHeader>
            <CardTitle>通知偏好</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col">
            <div class="flex items-center justify-between gap-4 border-b py-3.5">
              <div>
                <div class="text-sm font-medium">安全告警邮件</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  异地登录、密钥轮换失败时立即通知
                </div>
              </div>
              <Switch
                :checked="notifyForm.notifySecurity"
                @update:checked="(v: boolean) => (notifyForm.notifySecurity = v)"
              />
            </div>
            <div class="flex items-center justify-between gap-4 border-b py-3.5">
              <div>
                <div class="text-sm font-medium">成员邀请结果</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  邀请被接受或过期时发送摘要
                </div>
              </div>
              <Switch
                :checked="notifyForm.notifyInvite"
                @update:checked="(v: boolean) => (notifyForm.notifyInvite = v)"
              />
            </div>
            <div class="flex items-center justify-between gap-4 py-3.5">
              <div>
                <div class="text-sm font-medium">每周运营周报</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  周一 09:00 推送活跃成员与工单摘要
                </div>
              </div>
              <Switch
                :checked="notifyForm.notifyWeekly"
                @update:checked="(v: boolean) => (notifyForm.notifyWeekly = v)"
              />
            </div>
          </CardContent>
          <CardFooter class="justify-end border-t pt-4">
            <Button
              type="button"
              :disabled="savingNotify"
              @click="onSaveNotify"
            >
              保存通知设置
            </Button>
          </CardFooter>
        </Card>

        <!-- 登录安全 -->
        <Card v-show="activeTab === 'security'">
          <CardHeader>
            <CardTitle>登录安全</CardTitle>
          </CardHeader>
          <CardContent class="flex flex-col gap-6">
            <div class="flex flex-col">
              <div class="flex items-center justify-between gap-4 border-b py-3.5">
                <div>
                  <div class="text-sm font-medium">双因素认证（MFA）</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    使用身份验证器 App 生成一次性验证码
                  </div>
                </div>
                <Switch
                  :checked="mfaEnabled"
                  @update:checked="onToggleMfa"
                />
              </div>
              <div class="flex items-center justify-between gap-4 py-3.5">
                <div>
                  <div class="text-sm font-medium">空闲 30 分钟后自动退出</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    适用于共享设备与会议室电脑
                  </div>
                </div>
                <Switch
                  :checked="idleLogout"
                  @update:checked="onToggleIdle"
                />
              </div>
            </div>

            <div>
              <h3 class="mb-3 text-base font-semibold">修改密码</h3>
              <form
                class="grid gap-4 sm:grid-cols-2"
                @submit="onChangePassword"
              >
                <div class="flex flex-col gap-2 sm:col-span-2">
                  <Label for="pw-current">当前密码</Label>
                  <Input
                    id="pw-current"
                    v-model="passwordForm.current"
                    type="password"
                    autocomplete="current-password"
                    :aria-invalid="passwordErrors.current"
                  />
                  <p
                    v-if="passwordErrors.current"
                    class="text-xs text-destructive"
                  >
                    请输入当前密码
                  </p>
                </div>
                <div class="flex flex-col gap-2">
                  <Label for="pw-next">新密码</Label>
                  <Input
                    id="pw-next"
                    v-model="passwordForm.next"
                    type="password"
                    autocomplete="new-password"
                    placeholder="8 位以上，含字母与数字"
                    :aria-invalid="passwordErrors.next"
                  />
                  <p
                    v-if="passwordErrors.next"
                    class="text-xs text-destructive"
                  >
                    需至少 8 位，且同时包含字母与数字
                  </p>
                </div>
                <div class="flex flex-col gap-2">
                  <Label for="pw-confirm">确认新密码</Label>
                  <Input
                    id="pw-confirm"
                    v-model="passwordForm.confirm"
                    type="password"
                    autocomplete="new-password"
                    :aria-invalid="passwordErrors.confirm"
                  />
                  <p
                    v-if="passwordErrors.confirm"
                    class="text-xs text-destructive"
                  >
                    两次输入不一致
                  </p>
                </div>
                <div class="sm:col-span-2">
                  <Button
                    type="submit"
                    :disabled="savingPassword"
                  >
                    更新密码
                  </Button>
                </div>
              </form>
            </div>

            <div>
              <h3 class="mb-3 text-base font-semibold">活动会话</h3>
              <div
                v-if="!sessions.length"
                class="text-sm text-muted-foreground"
              >
                暂无其他活动会话
              </div>
              <div
                v-for="item in sessions"
                :key="item.id"
                class="flex items-center justify-between gap-4 border-b py-3.5 last:border-b-0"
              >
                <div>
                  <div class="text-sm font-medium">{{ item.label }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    <template v-if="item.isCurrent">
                      当前会话<template v-if="item.ip"> · {{ item.ip }}</template>
                    </template>
                    <template v-else>
                      {{ formatRelative(item.createdAt)
                      }}<template v-if="item.ip"> · {{ item.ip }}</template>
                    </template>
                  </div>
                </div>
                <Badge
                  v-if="item.isCurrent"
                  variant="secondary"
                >
                  当前
                </Badge>
                <Button
                  v-else
                  type="button"
                  variant="destructive"
                  size="sm"
                  @click="onRevokeSession(item)"
                >
                  撤销
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
