/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** 本地预览壳层时跳过路由守卫（默认关闭） */
  readonly VITE_SHELL_DEV_BYPASS_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
