import type { UserRole, UserStatus } from '@/types/users'

/**
 * 角色中文标签。
 */
export function roleLabel(role: UserRole): string {
  const map: Record<UserRole, string> = {
    admin: '工作区管理员',
    ops: '运营',
    viewer: '只读观察者',
  }
  return map[role]
}

/**
 * 状态中文标签。
 */
export function statusLabel(status: UserStatus): string {
  const map: Record<UserStatus, string> = {
    active: '正常',
    invited: '待接受',
    disabled: '已停用',
  }
  return map[status]
}

/**
 * 姓名首字作为头像字。
 */
export function nameInitial(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : '?'
}

/**
 * 相对/绝对时间的简易展示。
 */
export function formatLastLogin(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')

  if (date >= startOfToday) {
    return `今天 ${hh}:${mm}`
  }
  if (date >= startOfYesterday) {
    return `昨天 ${hh}:${mm}`
  }

  const diffDays = Math.floor(
    (startOfToday.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  )
  if (diffDays > 0 && diffDays < 7) {
    return `${diffDays} 天前`
  }

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
