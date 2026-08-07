import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_KEY = 'novaops-theme'

const theme = ref<ThemeMode>(readStoredTheme())

/**
 * 读取已持久化主题，非法值回落 light。
 */
function readStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/**
 * 同步 DOM：`data-theme`（原型）+ `.dark`（shadcn）。
 */
function applyThemeToDom(mode: ThemeMode): void {
  const root = document.documentElement
  root.dataset.theme = mode
  root.classList.toggle('dark', mode === 'dark')
}

/**
 * 明暗主题 composable（跨组件共享同一 ref）。
 */
export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  /**
   * 应用主题并持久化。
   */
  function setTheme(mode: ThemeMode): void {
    theme.value = mode
    applyThemeToDom(mode)
    try {
      localStorage.setItem(THEME_KEY, mode)
    } catch {
      // ignore quota / private mode
    }
  }

  /**
   * 在 light / dark 间切换，返回切换后的模式。
   */
  function toggleTheme(): ThemeMode {
    const next: ThemeMode = theme.value === 'dark' ? 'light' : 'dark'
    setTheme(next)
    return next
  }

  /**
   * 启动时从 storage 同步到 DOM（防闪烁需配合 index.html 内联脚本）。
   */
  function syncTheme(): void {
    setTheme(readStoredTheme())
  }

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
    syncTheme,
  }
}
