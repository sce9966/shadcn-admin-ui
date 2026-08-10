<script setup lang="ts">
import { Eye, EyeOff } from '@lucide/vue'
import axios from 'axios'
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

type AuthTab = 'login' | 'register'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const tab = ref<AuthTab>('login')
const submitting = ref(false)
const showLoginPassword = ref(false)
const showRegPassword = ref(false)

const loginForm = reactive({
  email: '',
  password: '',
  remember: false,
})
const loginErrors = reactive({
  email: false,
  password: false,
})
const loginAlert = ref('')

const registerForm = reactive({
  name: '',
  orgName: '',
  email: '',
  password: '',
  confirm: '',
  terms: false,
})
const registerErrors = reactive({
  name: false,
  orgName: false,
  email: false,
  password: false,
  confirm: false,
  terms: false,
})
const registerAlert = ref('')

/**
 * 切换登录 / 注册。
 */
function switchTab(next: AuthTab) {
  tab.value = next
  loginAlert.value = ''
  registerAlert.value = ''
}

/**
 * 基础邮箱校验。
 */
function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/**
 * 登录成功后跳转。
 */
async function goAfterAuth() {
  const redirect = String(route.query.redirect || '')
  const target =
    redirect &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//') &&
    !redirect.startsWith('/auth')
      ? redirect
      : '/dashboard'
  await router.replace(target)
}

/**
 * 提取 axios 业务错误文案。
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
 * 提交登录。
 */
async function onLoginSubmit(event: Event) {
  event.preventDefault()
  loginAlert.value = ''
  const emailBad = !isEmail(loginForm.email)
  const passBad = loginForm.password.length < 8
  loginErrors.email = emailBad
  loginErrors.password = passBad
  if (emailBad || passBad) {
    loginAlert.value = '请先修正标红字段后再登录。'
    return
  }

  submitting.value = true
  try {
    await auth.login({
      email: loginForm.email,
      password: loginForm.password,
      remember: loginForm.remember,
    })
    toast.success('登录成功，正在进入仪表盘…')
    await goAfterAuth()
  } catch (error) {
    loginAlert.value = extractErrorMessage(error, '登录失败，请稍后重试')
    if (loginAlert.value.includes('停用')) {
      loginErrors.email = true
    }
  } finally {
    submitting.value = false
  }
}

/**
 * 提交注册。
 */
async function onRegisterSubmit(event: Event) {
  event.preventDefault()
  registerAlert.value = ''
  const nameBad = registerForm.name.trim().length < 2
  const orgBad = registerForm.orgName.trim().length < 2
  const emailBad = !isEmail(registerForm.email)
  const passBad = !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(registerForm.password)
  const confirmBad =
    !registerForm.confirm || registerForm.confirm !== registerForm.password
  const termsBad = !registerForm.terms

  registerErrors.name = nameBad
  registerErrors.orgName = orgBad
  registerErrors.email = emailBad
  registerErrors.password = passBad
  registerErrors.confirm = confirmBad
  registerErrors.terms = termsBad

  if (nameBad || orgBad || emailBad || passBad || confirmBad || termsBad) {
    registerAlert.value = '注册信息不完整，请检查标红字段。'
    return
  }

  submitting.value = true
  try {
    await auth.register({
      name: registerForm.name.trim(),
      orgName: registerForm.orgName.trim(),
      email: registerForm.email,
      password: registerForm.password,
    })
    toast.success('工作区已创建，正在进入仪表盘…')
    await goAfterAuth()
  } catch (error) {
    registerAlert.value = extractErrorMessage(error, '注册失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

/**
 * 忘记密码（演示）。
 */
function onForgot() {
  toast('已向管理员发送重置指引（演示）')
}
</script>

<template>
  <AuthLayout>
    <div
      class="mb-7 grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
      role="tablist"
      aria-label="登录或注册"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'login'"
        :class="
          cn(
            'h-9 rounded-sm text-sm font-medium text-muted-foreground transition-colors',
            tab === 'login' && 'bg-background text-foreground shadow-sm',
          )
        "
        @click="switchTab('login')"
      >
        登录
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="tab === 'register'"
        :class="
          cn(
            'h-9 rounded-sm text-sm font-medium text-muted-foreground transition-colors',
            tab === 'register' && 'bg-background text-foreground shadow-sm',
          )
        "
        @click="switchTab('register')"
      >
        注册
      </button>
    </div>

    <div v-show="tab === 'login'" role="tabpanel">
      <h2 class="mb-1.5 text-xl font-semibold">欢迎回来</h2>
      <p class="mb-7 text-sm text-muted-foreground">使用工作邮箱登录企业工作区。</p>

      <div
        v-if="loginAlert"
        class="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        role="alert"
      >
        {{ loginAlert }}
      </div>

      <form class="flex flex-col gap-4" novalidate @submit="onLoginSubmit">
        <div class="flex flex-col gap-2">
          <Label for="login-email">工作邮箱</Label>
          <Input
            id="login-email"
            v-model="loginForm.email"
            type="email"
            autocomplete="username"
            placeholder="you@company.com"
            :aria-invalid="loginErrors.email || undefined"
          />
          <p v-if="loginErrors.email" class="text-xs text-destructive">
            请输入有效的企业邮箱地址
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="login-password">密码</Label>
          <div class="relative">
            <Input
              id="login-password"
              v-model="loginForm.password"
              :type="showLoginPassword ? 'text' : 'password'"
              class="pr-11"
              autocomplete="current-password"
              placeholder="至少 8 位"
              :aria-invalid="loginErrors.password || undefined"
            />
            <button
              type="button"
              class="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:text-foreground"
              :aria-label="showLoginPassword ? '隐藏密码' : '显示密码'"
              @click="showLoginPassword = !showLoginPassword"
            >
              <EyeOff v-if="showLoginPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
          <p v-if="loginErrors.password" class="text-xs text-destructive">
            密码至少 8 位
          </p>
        </div>

        <div class="flex items-center justify-between gap-3">
          <label class="flex items-center gap-2 text-sm">
            <Checkbox
              id="remember"
              :checked="loginForm.remember"
              @update:checked="(v) => (loginForm.remember = v)"
            />
            保持登录 14 天
          </label>
          <Button type="button" variant="ghost" size="sm" @click="onForgot">
            忘记密码
          </Button>
        </div>

        <Button type="submit" class="mt-2 h-10 w-full" :disabled="submitting">
          登录工作区
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        还没有账号？
        <button
          type="button"
          class="font-semibold text-foreground underline underline-offset-4"
          @click="switchTab('register')"
        >
          创建企业账号
        </button>
      </p>
    </div>

    <div v-show="tab === 'register'" role="tabpanel">
      <h2 class="mb-1.5 text-xl font-semibold">创建企业工作区</h2>
      <p class="mb-7 text-sm text-muted-foreground">注册后可邀请成员并分配角色。</p>

      <div
        v-if="registerAlert"
        class="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        role="alert"
      >
        {{ registerAlert }}
      </div>

      <form class="flex flex-col gap-4" novalidate @submit="onRegisterSubmit">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <Label for="reg-name">姓名</Label>
            <Input
              id="reg-name"
              v-model="registerForm.name"
              autocomplete="name"
              placeholder="陈思远"
              :aria-invalid="registerErrors.name || undefined"
            />
            <p v-if="registerErrors.name" class="text-xs text-destructive">
              请填写真实姓名
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <Label for="reg-org">公司名称</Label>
            <Input
              id="reg-org"
              v-model="registerForm.orgName"
              autocomplete="organization"
              placeholder="星海科技"
              :aria-invalid="registerErrors.orgName || undefined"
            />
            <p v-if="registerErrors.orgName" class="text-xs text-destructive">
              请填写公司名称
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="reg-email">工作邮箱</Label>
          <Input
            id="reg-email"
            v-model="registerForm.email"
            type="email"
            autocomplete="email"
            placeholder="you@company.com"
            :aria-invalid="registerErrors.email || undefined"
          />
          <p v-if="registerErrors.email" class="text-xs text-destructive">
            请输入有效的企业邮箱地址
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="reg-password">设置密码</Label>
          <div class="relative">
            <Input
              id="reg-password"
              v-model="registerForm.password"
              :type="showRegPassword ? 'text' : 'password'"
              class="pr-11"
              autocomplete="new-password"
              placeholder="8 位以上，含字母与数字"
              :aria-invalid="registerErrors.password || undefined"
            />
            <button
              type="button"
              class="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:text-foreground"
              :aria-label="showRegPassword ? '隐藏密码' : '显示密码'"
              @click="showRegPassword = !showRegPassword"
            >
              <EyeOff v-if="showRegPassword" class="size-4" />
              <Eye v-else class="size-4" />
            </button>
          </div>
          <p v-if="registerErrors.password" class="text-xs text-destructive">
            需至少 8 位，且同时包含字母与数字
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <Label for="reg-confirm">确认密码</Label>
          <Input
            id="reg-confirm"
            v-model="registerForm.confirm"
            type="password"
            autocomplete="new-password"
            placeholder="再次输入密码"
            :aria-invalid="registerErrors.confirm || undefined"
          />
          <p v-if="registerErrors.confirm" class="text-xs text-destructive">
            两次输入的密码不一致
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <label class="flex items-start gap-2 text-sm">
            <Checkbox
              id="reg-terms"
              class="mt-0.5"
              :checked="registerForm.terms"
              @update:checked="(v) => (registerForm.terms = v)"
            />
            我已阅读并同意服务条款与数据处理协议
          </label>
          <p v-if="registerErrors.terms" class="text-xs text-destructive">
            请勾选同意条款后继续
          </p>
        </div>

        <Button type="submit" class="mt-2 h-10 w-full" :disabled="submitting">
          创建并进入仪表盘
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-muted-foreground">
        已有账号？
        <button
          type="button"
          class="font-semibold text-foreground underline underline-offset-4"
          @click="switchTab('login')"
        >
          返回登录
        </button>
      </p>
    </div>
  </AuthLayout>
</template>
