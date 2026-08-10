import { onMounted, onUnmounted, watch, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

const IDLE_MS = 30 * 60 * 1000

/**
 * 空闲 30 分钟后自动登出（仅当 idleLogout 为 true）。
 * @param enabled 是否启用（通常绑定当前用户的 idleLogout）
 */
export function useIdleLogout(enabled: Ref<boolean>) {
  const auth = useAuthStore()
  const router = useRouter()
  let timer: ReturnType<typeof setTimeout> | null = null

  /**
   * 重置空闲计时。
   */
  function reset() {
    if (timer) clearTimeout(timer)
    if (!enabled.value) return
    timer = setTimeout(async () => {
      toast.message('因空闲超时已退出登录')
      await auth.logout()
      await router.replace('/auth')
    }, IDLE_MS)
  }

  /**
   * 停止计时。
   */
  function stop() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const

  onMounted(() => {
    for (const event of events) {
      window.addEventListener(event, reset, { passive: true })
    }
    reset()
  })

  onUnmounted(() => {
    for (const event of events) {
      window.removeEventListener(event, reset)
    }
    stop()
  })

  watch(enabled, (on) => {
    if (on) reset()
    else stop()
  })
}
