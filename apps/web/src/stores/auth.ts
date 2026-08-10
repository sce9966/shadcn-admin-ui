import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  fetchMeApi,
  loginApi,
  logoutApi,
  registerApi,
} from '@/api/auth'
import {
  clearAccessToken,
  isAuthBypassEnabled,
  persistAccessToken,
  readAccessToken,
} from '@/lib/auth-token'
import type { AuthUser } from '@/types/auth'

/**
 * 鉴权状态：token、当前用户与登录/注册/登出。
 */
export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(readAccessToken())
  const user = ref<AuthUser | null>(null)
  const bootstrapped = ref(false)

  const isAuthenticated = computed(
    () => Boolean(accessToken.value) || isAuthBypassEnabled(),
  )

  /**
   * 从 storage 恢复 token。
   */
  function hydrateFromStorage() {
    accessToken.value = readAccessToken()
  }

  /**
   * 应用会话（token + user）。
   */
  function applySession(
    token: string,
    nextUser: AuthUser,
    remember: boolean,
  ) {
    persistAccessToken(token, remember)
    accessToken.value = token
    user.value = nextUser
  }

  /**
   * 清空本地会话。
   */
  function clearSession() {
    clearAccessToken()
    accessToken.value = null
    user.value = null
  }

  /**
   * 登录。
   */
  async function login(payload: {
    email: string
    password: string
    remember?: boolean
  }) {
    const res = await loginApi(payload)
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '登录失败')
    }
    applySession(res.data.accessToken, res.data.user, Boolean(payload.remember))
    return res.data
  }

  /**
   * 注册。
   */
  async function register(payload: {
    name: string
    orgName: string
    email: string
    password: string
  }) {
    const res = await registerApi(payload)
    if (res.code !== 0 || !res.data) {
      throw new Error(res.message || '注册失败')
    }
    applySession(res.data.accessToken, res.data.user, true)
    return res.data
  }

  /**
   * 拉取当前用户；失败则清会话。
   */
  async function fetchMe() {
    if (!accessToken.value) {
      user.value = null
      return null
    }
    try {
      const res = await fetchMeApi()
      if (res.code !== 0 || !res.data) {
        clearSession()
        return null
      }
      user.value = res.data
      return res.data
    } catch {
      clearSession()
      return null
    }
  }

  /**
   * 登出（尽力吊销服务端会话）。
   */
  async function logout() {
    try {
      if (accessToken.value) {
        await logoutApi()
      }
    } catch {
      // 忽略网络错误，本地仍清会话
    } finally {
      clearSession()
    }
  }

  /**
   * 用最新用户摘要覆盖 store（资料保存后同步顶栏）。
   */
  function setUser(next: AuthUser) {
    user.value = next
  }

  /**
   * 部分合并用户字段（安全开关等）。
   */
  function patchUser(partial: Partial<AuthUser>) {
    if (!user.value) return
    user.value = { ...user.value, ...partial }
  }

  /**
   * 应用启动时初始化会话。
   */
  async function bootstrap() {
    hydrateFromStorage()
    if (accessToken.value) {
      await fetchMe()
    }
    bootstrapped.value = true
  }

  return {
    accessToken,
    user,
    bootstrapped,
    isAuthenticated,
    hydrateFromStorage,
    login,
    register,
    fetchMe,
    logout,
    clearSession,
    setUser,
    patchUser,
    bootstrap,
  }
})
