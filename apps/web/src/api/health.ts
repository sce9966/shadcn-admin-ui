import { http } from './http'

/**
 * 后端统一响应结构。
 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/**
 * 健康检查（脚手架联调用）。
 */
export async function fetchHealth() {
  const { data } = await http.get<ApiResponse<{ status: string; timestamp: string }>>(
    '/health',
  )
  return data
}
