import type { Component } from 'vue'
import { LayoutDashboard, Settings, Users } from '@lucide/vue'

/** 侧栏导航项（对齐 design/js/layout.js NAV_ITEMS） */
export interface NavItem {
  id: string
  group: string
  label: string
  path: string
  icon: Component
}

/** 主导航配置 */
export const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    group: '总览',
    label: '仪表盘',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'users',
    group: '组织',
    label: '用户管理',
    path: '/users',
    icon: Users,
  },
  {
    id: 'settings',
    group: '组织',
    label: '个人设置',
    path: '/settings',
    icon: Settings,
  },
]

/**
 * 将扁平导航转为带分组的渲染结构。
 */
export function groupNavItems(items: NavItem[] = NAV_ITEMS) {
  const groups: { group: string; items: NavItem[] }[] = []
  for (const item of items) {
    const last = groups[groups.length - 1]
    if (!last || last.group !== item.group) {
      groups.push({ group: item.group, items: [item] })
    } else {
      last.items.push(item)
    }
  }
  return groups
}
