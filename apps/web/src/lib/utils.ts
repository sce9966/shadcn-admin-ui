import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind class，处理条件与冲突。
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
