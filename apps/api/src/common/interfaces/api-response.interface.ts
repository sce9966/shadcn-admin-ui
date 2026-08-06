/**
 * 统一 API 响应结构。
 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}

/**
 * 构造成功响应。
 */
export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}

/**
 * 构造业务失败响应。
 */
export function fail(code: number, message: string): ApiResponse<null> {
  return { code, message, data: null }
}
