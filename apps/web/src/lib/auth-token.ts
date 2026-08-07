/** Access Token 存储键（与脚手架 / AIL-36 设计一致） */
export const ACCESS_TOKEN_KEY = 'novaops_access_token'

/**
 * 从 localStorage / sessionStorage 读取 access token。
 */
export function readAccessToken(): string | null {
  return (
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  )
}

/**
 * 写入 access token。
 * @param token JWT
 * @param remember true → localStorage；false → sessionStorage
 */
export function writeAccessToken(token: string, remember = true): void {
  clearAccessToken()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(ACCESS_TOKEN_KEY, token)
}

/** `writeAccessToken` 别名（与鉴权 store 命名对齐） */
export const persistAccessToken = writeAccessToken

/**
 * 清除两端 storage 中的 token。
 */
export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
}

/**
 * 开发旁路：跳过路由守卫（仅 `VITE_SHELL_DEV_BYPASS_AUTH=true`）。
 */
export function isAuthBypassEnabled(): boolean {
  return import.meta.env.VITE_SHELL_DEV_BYPASS_AUTH === 'true'
}
