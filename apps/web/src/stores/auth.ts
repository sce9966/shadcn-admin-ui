import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { http } from '@/api/http'
import {
  clearAccessToken,
  isAuthBypassEnabled,
  readAccessToken,
} from '@/lib/auth-token'

/** 当前用户（壳层消费面；AIL-35 可扩展字段） */
export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  organizationName?: string
}

/**
 * 鉴权 store 最小契约（AIL-35 / AIL-36 共用）。
 * 本 issue 提供 stub：读 token、可选 /me、logout 清本地。
 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(readAccessToken())
  const user = ref<AuthUser | null>(null)
  const hydrated = ref(false)

  const isAuthenticated = computed(
    () => Boolean(token.value) || isAuthBypassEnabled(),
  )

  /**
   * 从 storage 恢复 token，并尽力拉取 `/auth/me`（失败不抛出）。
   */
  async function hydrate(): Promise<void> {
    token.value = readAccessToken()
    if (!token.value) {
      user.value = null
      hydrated.value = true
      return
    }

    try {
      const { data } = await http.get<{
        code: number
        data: AuthUser | null
      }>('/auth/me')
      if (data.code === 0 && data.data) {
        user.value = data.data
      } else {
        user.value = null
      }
    } catch {
      user.value = null
    } finally {
      hydrated.value = true
    }
  }

  /**
   * 登出：清本地 token；可选调用 logout API（失败忽略）。
   */
  async function logout(): Promise<void> {
    try {
      if (token.value) {
        await http.post('/auth/logout')
      }
    } catch {
      // AIL-35 未就绪或网络失败时仍清本地会话
    }
    clearAccessToken()
    token.value = null
    user.value = null
  }

  /**
   * 同步内存中的 token（供 AIL-35 login 后调用）。
   */
  function setToken(next: string | null): void {
    token.value = next
  }

  /**
   * 设置当前用户。
   */
  function setUser(next: AuthUser | null): void {
    user.value = next
  }

  return {
    token,
    user,
    hydrated,
    isAuthenticated,
    hydrate,
    logout,
    setToken,
    setUser,
  }
})
