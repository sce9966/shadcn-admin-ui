# 星枢 NovaOps 开发模板设计文档

> Issue：AIL-33 · 父任务：AIL-32  
> 原型基线：仓库 `design/`（auth / dashboard / users / settings + 共享壳层）  
> 状态：设计已通过并已 @ 全栈工程师（2026-08-06）· Stage 1 完成 · 实现见 Stage 2+

---

## 1. 背景与目标

### 1.1 背景

仓库已具备品牌「星枢 NovaOps」高保真 HTML 原型（固定画布 1920×1080、Shadcn 风格 token、统一侧栏壳层）。目标是将其落地为可本地启动的企业中后台 **全栈开发模板**，供后续业务在此骨架上扩展。

### 1.2 目标

1. 明确页面 → 路由、信息架构与关键交互对齐方式。
2. 给出 TypeORM + MySQL 数据模型与 REST API 契约（统一响应）。
3. 选定鉴权方案并写清假设。
4. 约定前端目录、壳层组件与 shadcn-vue 清单，以及设计 token 映射。
5. 划定范围内 / 范围外，并按父 issue 子任务 stage 给出实现分期。

本设计文档是后续 Stage 2+ 编码的**唯一依据**；实现中若需改方案，须先修订本文档再编码。

---

## 2. 范围与非范围

### 2.1 范围内（P0）

| 域 | 内容 |
|---|---|
| 工程 | pnpm monorepo：`apps/web`（Vue 3 + Vite + shadcn-vue）+ `apps/api`（NestJS + TypeORM + MySQL） |
| 鉴权 | 注册、登录、当前用户、登出；JWT；路由守卫 |
| 壳层 | 侧栏导航、顶栏（面包屑 / 主题 / 通知占位 / 用户菜单）、明暗主题 |
| 业务页 | 仪表盘、用户管理（列表/筛选/邀请/启停）、个人设置（资料/通知/安全） |
| 视觉 | 对齐 `design/` 信息结构与关键交互；token 映射到 shadcn CSS 变量 |

### 2.2 范围外（明确不做或仅演示）

| 项 | 说明 |
|---|---|
| `design/index.html` 入口导览 | **不作为产品路由**；仅保留在 `design/` 作原型索引。`/` 仅做登录态分流：已登录 → `/dashboard`，未登录 → `/auth` |
| 邀请接受落地页 | 首期**不做**邮件落地 / 设密激活；邀请仅创建 `invited` 记录 + Toast |
| 真实邮件发送 | 邀请 / 忘记密码 / 通知：**记录意图 + Toast**，不接 SMTP（可预留接口） |
| 完整 MFA 绑定流程 | UI 开关 + Toast；不实现 TOTP 绑定/校验（标为后续增强） |
| 审计导出 / CSV | 用户管理「导出 CSV」、仪表盘「导出审计」：P1，首期可用前端 mock Toast |
| 多工作区 / 租户切换 | 注册创建单个 Organization；无工作区切换 UI |
| 生产部署 / CI | 除非后续 issue 纳入 |
| 工单 / 存储配额真实数据源 | 仪表盘 KPI 可走只读 API，首期允许 seed/mock |
| 固定 1920×1080 画布 | 产品实现改为**桌面优先响应式**（侧栏固定宽 240px），不锁死 canvas |

### 2.3 假设（评审可改）

1. **单租户工作区模型**：注册时创建 Organization，创建者为 `admin`；成员通过邀请加入同一 Organization。
2. **包管理器**：pnpm；**Node**：≥ 20 LTS。
3. **开发期** TypeORM `synchronize: true` 可用；提供 migration 脚本，生产禁止 synchronize。
4. **忘记密码**：首期仅 Toast「已向管理员发送重置指引」，不建重置 token 表。
5. **通知铃铛**：首期 Toast 占位；无通知中心页。
6. **顶栏全局搜索**：原型壳层未强制；首期不做。

---

## 3. 信息架构与路由

### 3.1 导航结构（对齐 `design/js/layout.js`）

```text
总览
  └─ 仪表盘          /dashboard
组织
  ├─ 用户管理        /users
  └─ 个人设置        /settings
```

品牌副标题：`{orgName} · 生产环境`（数据来自当前 Organization）。

### 3.2 页面 → 路由映射

| 原型文件 | 产品路由 | 布局 | 鉴权 |
|---|---|---|---|
| `design/index.html` | （无） | — | — |
| `design/auth.html` | `/auth` | AuthLayout（左右分栏） | 访客；已登录重定向 `/dashboard` |
| `design/dashboard.html` | `/dashboard` | AdminShell | 需登录 |
| `design/users.html` | `/users` | AdminShell | 需登录；邀请/启停需 `admin`（见权限） |
| `design/settings.html` | `/settings` | AdminShell | 需登录 |
| — | `/` | — | 重定向：已登录 → `/dashboard`，否则 → `/auth` |

设置页内部分区（客户端状态或 query）：

| pane | 含义 | 建议 |
|---|---|---|
| `profile` | 个人资料 | 默认；`?tab=profile` |
| `notify` | 通知偏好 | `?tab=notify` |
| `security` | 登录安全 | `?tab=security` |

### 3.3 关键用户流程

```text
注册 → 创建 Org + Admin User → 签发 JWT → /dashboard
登录 → 校验邮箱密码 / 状态 → 签发 JWT（可选 remember）→ /dashboard
登出 → 清 token（可选吊销 Session）→ /auth
邀请 → admin 创建 invited User → Toast 提示成功；首期保持 `invited`，无接受/设密激活链路
启停 → admin 切换 active/disabled；禁止停用当前登录用户
```

---

## 4. 数据模型（TypeORM + MySQL）

### 4.1 ER 概览

```text
Organization 1──* User
User 1──* Session
User 1──1 UserPreference（通知 + 安全偏好）
User 1──* Activity（可选，仪表盘动态）
```

### 4.2 表与字段

#### `organizations`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `name` | varchar(128) | 公司/工作区名称 |
| `slug` | varchar(64) UNIQUE | 可选，由 name 生成 |
| `created_at` / `updated_at` | datetime | |

#### `users`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `organization_id` | bigint FK NOT NULL | 索引 |
| `email` | varchar(255) | **组织内唯一** `(organization_id, email)` |
| `password_hash` | varchar(255) | bcrypt；`invited` 可为空直至接受 |
| `name` | varchar(64) | 显示名 |
| `title` | varchar(128) NULL | 职位 |
| `bio` | text NULL | 简介 |
| `role` | enum(`admin`,`ops`,`viewer`) | 默认 `ops` |
| `status` | enum(`active`,`invited`,`disabled`) | 默认 `active`（注册）/ `invited`（邀请） |
| `invite_note` | varchar(512) NULL | 邀请备注 |
| `invite_expires_at` | datetime NULL | 邀请 7 天有效 |
| `last_login_at` | datetime NULL | |
| `mfa_enabled` | tinyint(1) | 默认 0；首期仅存开关 |
| `idle_logout` | tinyint(1) | 默认 1；空闲 30 分钟退出（前端实现为主） |
| `created_at` / `updated_at` | datetime | |

**索引**：`uk_users_org_email (organization_id, email)`；`idx_users_org_status (organization_id, status)`；`idx_users_org_role (organization_id, role)`。

#### `sessions`（登录安全 · 活动会话）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `user_id` | bigint FK | 索引 |
| `token_jti` | varchar(64) UNIQUE | JWT `jti`，用于吊销 |
| `user_agent` | varchar(512) NULL | |
| `ip` | varchar(64) NULL | |
| `label` | varchar(128) NULL | 如 `Chrome · Windows · 上海`（可简化） |
| `is_current` | 派生 | 比较当前 jti |
| `expires_at` | datetime | |
| `revoked_at` | datetime NULL | |
| `created_at` | datetime | |

#### `user_preferences`

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | bigint PK FK | |
| `notify_security` | tinyint(1) | 默认 1 |
| `notify_invite` | tinyint(1) | 默认 1 |
| `notify_weekly` | tinyint(1) | 默认 0 |
| `updated_at` | datetime | |

#### `activities`（仪表盘「最近动态」· 可分期）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `organization_id` | bigint FK | |
| `actor_user_id` | bigint NULL | |
| `title` | varchar(255) | |
| `subtitle` | varchar(255) NULL | |
| `created_at` | datetime | |

**假设**：Stage 4 Dashboard 首期可用 seed 数据或静态 mock；有余力再写 activity。

### 4.3 枚举对照（与原型一致）

| 角色 `role` | 中文 |
|---|---|
| `admin` | 工作区管理员 |
| `ops` | 运营 |
| `viewer` | 只读观察者 |

| 状态 `status` | 中文 | 行为 |
|---|---|---|
| `active` | 正常 | 可登录 |
| `invited` | 待接受 | 不可登录；首期无接受链路，仅列表展示 / 重发 / 启停管理 |
| `disabled` | 已停用 | 登录返回业务错误（对齐 `demo@blocked.com`） |

### 4.4 权限矩阵（假设）

| 能力 | admin | ops | viewer |
|---|---|---|---|
| 查看仪表盘 | ✓ | ✓ | ✓ |
| 查看成员列表 | ✓ | ✓ | ✓ |
| 邀请 / 重发 / 启停 | ✓ | ✗ | ✗ |
| 导出 CSV | ✓ | ✗ | ✗ |
| 改自己的资料/偏好/密码 | ✓ | ✓ | ✓ |
| 改他人角色 | 首期不做 UI | — | — |

---

## 5. API 契约

### 5.1 约定

- 全局前缀：`/api`
- 字段：`camelCase`；时间：ISO 8601
- 统一成功：`{ "code": 0, "message": "ok", "data": ... }`
- 业务失败：HTTP 4xx/5xx + `{ "code": <非0>, "message": "...", "data": null }`
- 分页：`data: { items, total, page, pageSize }`
- 鉴权头：`Authorization: Bearer <accessToken>`

### 5.2 Auth

| 方法 | 路径 | 说明 | Body / Query |
|---|---|---|---|
| POST | `/api/auth/register` | 注册并创建组织 | `{ name, orgName, email, password }`（`confirm`/`terms` 仅前端） |
| POST | `/api/auth/login` | 登录 | `{ email, password, remember?: boolean }` |
| POST | `/api/auth/logout` | 登出（吊销当前 session） | — |
| GET | `/api/auth/me` | 当前用户 + org 摘要 | — |

**登录成功 `data`：**

```json
{
  "accessToken": "<jwt>",
  "expiresIn": 86400,
  "user": {
    "id": "1",
    "name": "陈思远",
    "email": "chen@xinghai.cn",
    "role": "admin",
    "status": "active",
    "title": "产品运营负责人",
    "organization": { "id": "1", "name": "星海科技" }
  }
}
```

**校验规则（对齐原型）：**

- 邮箱：基础 email 格式
- 登录密码：≥ 8 位
- 注册密码：≥ 8 且同时含字母与数字
- `remember=true`：token 有效期 **14 天**；否则 **1 天**（假设）

**错误示例：** 停用账号 → HTTP 403，`message`:「该账号已被停用，请联系工作区管理员。」

### 5.3 Users（成员管理）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/users` | 分页列表；`keyword`/`role`/`status`/`page`/`pageSize` |
| POST | `/api/users/invites` | 邀请；`{ email, role, note? }` → 创建 `invited` |
| POST | `/api/users/:id/resend-invite` | 重发邀请（仅 `invited`） |
| PATCH | `/api/users/:id/status` | `{ status: "active" \| "disabled" }` |
| GET | `/api/users/export` | **P1** CSV；首期可 501 或前端 mock |

列表项字段：`id, name, email, role, status, lastLoginAt, initial`（`initial` 可由 name 首字派生，不必入库）。

### 5.4 Settings / Me

| 方法 | 路径 | 说明 |
|---|---|---|
| PATCH | `/api/me/profile` | `{ name, title, email, bio? }` |
| GET/PATCH | `/api/me/preferences` | 通知三开关 |
| POST | `/api/me/password` | `{ currentPassword, newPassword }` |
| PATCH | `/api/me/security` | `{ mfaEnabled?, idleLogout? }` |
| GET | `/api/me/sessions` | 活动会话列表 |
| DELETE | `/api/me/sessions/:id` | 撤销会话（不可撤销当前会话或允许但立即登出——假设：不可撤销当前） |

### 5.5 Dashboard

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/dashboard/overview?range=7d\|30d\|90d` | KPI + 图表序列 |
| GET | `/api/dashboard/activities?limit=10` | 最近动态 |

`overview.data` 形状：

```json
{
  "range": "7d",
  "caption": "近 7 天 · 按小时聚合",
  "kpi": {
    "activeMembers": 128,
    "openTickets": 17,
    "loginSuccessRate": 98.6,
    "storageUsedGb": 2457.6,
    "storageQuotaGb": 5120
  },
  "deltas": { "activeMembers": "+6", "openTickets": "−3" },
  "chart": { "labels": ["00", "02", "..."], "values": [42, 55, "..."] }
}
```

**假设**：KPI/图表可由 seed 按 range 返回固定演示数据，不强制真实计量。

---

## 6. 鉴权方案

| 项 | 选择 |
|---|---|
| 方案 | **JWT**（access token）；不强制 refresh token（假设） |
| 算法 | HS256；密钥环境变量 `JWT_SECRET`（勿入库、勿提交） |
| Payload | `sub`=userId，`org`=organizationId，`role`，`jti`，`exp` |
| 存储 | 前端 `localStorage`（remember）或 `sessionStorage`（不 remember）——假设；键名 `novaops_token` |
| 守卫 | Nest `JwtAuthGuard` 全局（Auth 白名单除外）；Vue Router `beforeEach` |
| 密码 | bcrypt（cost 10+） |
| 会话吊销 | 改密 / 主动 logout / DELETE session → 写 `sessions.revoked_at`；请求时校验 jti 未吊销 |

**不做（首期）：** OAuth、SSO、真正的邮件重置密码、TOTP 校验。

---

## 7. 前端架构

### 7.1 目录（`apps/web`）

```text
src/
  api/                 # axios 封装与各域 API
  assets/
  components/
    ui/                # shadcn-vue
    layout/            # AppSidebar, AppTopbar, UserMenu, ThemeToggle
    users/             # InviteDrawer, UsersToolbar, ...
    dashboard/         # KpiCards, TrafficChart, ActivityList, ...
    settings/          # ProfileForm, NotifySwitches, SecurityPanel, ...
  composables/
  layouts/
    AuthLayout.vue
    AdminLayout.vue
  router/
  stores/              # auth, theme
  styles/              # globals.css（token）
  types/
  views/
    auth/AuthView.vue
    dashboard/DashboardView.vue
    users/UsersView.vue
    settings/SettingsView.vue
  App.vue
  main.ts
```

### 7.2 壳层组件职责

| 组件 | 对齐原型 |
|---|---|
| `AdminLayout` | `.shell`：sidebar + main(topbar + content) |
| `AppSidebar` | 品牌、分组导航、active 态 |
| `AppTopbar` | 面包屑、标题、主题、通知、用户菜单 |
| `UserMenu` | Dropdown：资料入口、退出 |
| `ThemeToggle` | `data-theme` + localStorage `novaops-theme` |
| `AuthLayout` | 左视觉 + 右表单 520px 栏 |

### 7.3 shadcn-vue 组件清单（首期）

| 组件 | 用途 |
|---|---|
| `Button` | 主/次/幽灵/危险 |
| `Input` / `Textarea` / `Label` | 表单 |
| `Checkbox` / `Switch` | 记住登录、条款、通知、MFA |
| `Select` | 角色/状态筛选、邀请角色 |
| `Tabs` | 登录/注册；可选设置分区 |
| `Card` | KPI、面板 |
| `Table` | 用户列表 |
| `Badge` | 状态 |
| `DropdownMenu` | 用户菜单 |
| `Sheet` | 邀请抽屉（对齐 drawer） |
| `Dialog` / `Alert` | 可选确认 |
| `Sonner` / `Toast` | 全局提示 |
| `Breadcrumb` | 顶栏 |
| `Avatar` | 成员头像字 |
| `Separator` | 菜单分隔 |
| `Form` + vee-validate/zod（可选） | 表单校验 |

图表：首期用 **纯 CSS/HTML 柱状条**（对齐原型），不强制引入 ECharts；若后续需要再加。

### 7.4 状态与主题

- Pinia `useAuthStore`：user、token、login/logout/fetchMe
- Pinia 或 composable `useTheme`：`light` | `dark`，同步 `document.documentElement.dataset.theme`
- HTTP 拦截：附带 Bearer；`401` 清会话并跳转 `/auth?redirect=`

---

## 8. 设计 Token / 主题对照

来源：`design/css/admin.css`。实现映射到 shadcn-vue + Tailwind CSS 变量（`:root` / `.dark`）。

| 原型 token | 建议 shadcn / CSS 变量 | Light | Dark |
|---|---|---|---|
| `--bg` / `--surface` | `--background` / `--card` | `#ffffff` | `#09090b` |
| `--fg` | `--foreground` | `#111827` | `#fafafa` |
| `--muted` | `--muted-foreground` | `#64748b` | `#a1a1aa` |
| `--border` | `--border` | `#e5e7eb` | `#27272a` |
| `--accent` / `--accent-on` | `--primary` / `--primary-foreground` | `#000` / `#fff` | `#fafafa` / `#09090b` |
| `--success` / `--warn` / `--danger` | 扩展或语义色 | `#16a34a` / `#d97706` / `#dc2626` | 同左（可微调） |
| `--radius-sm/md/lg` | `--radius` 体系 | 6 / 8 / 12 | 同 |
| `--sidebar-w` | layout 常量 | `240px` | |
| `--topbar-h` | layout 常量 | `64px` | |
| 字体 | Geist → 可用 `Geist` / 系统回退；mono：`Fira Code` / ui-monospace | | |

动效：`--motion-fast: 150ms`，`--motion-base: 200ms`，`cubic-bezier(0.2, 0, 0, 1)`。

**画布**：原型 `.canvas` 1920×1080 仅设计稿约束；产品用全视口布局，桌面优先。

---

## 9. 关键交互清单（验收对照）

### 9.1 Auth

- [ ] Tab 切换登录 / 注册
- [ ] 密码可见性切换
- [ ] 字段校验与 alert 错误态
- [ ] 记住登录 14 天
- [ ] 忘记密码 → Toast（演示）
- [ ] 停用账号错误文案
- [ ] 成功 → `/dashboard`

### 9.2 Shell

- [ ] 三页导航与 active
- [ ] 主题切换持久化 + Toast
- [ ] 用户菜单：设置 / 退出
- [ ] 通知按钮 Toast 占位

### 9.3 Dashboard

- [ ] 时间范围 7d / 30d / 90d 切换 KPI + 图表
- [ ] 最近动态列表
- [ ] 快捷操作跳转 users / settings

### 9.4 Users

- [ ] 关键词 / 角色 / 状态筛选 + 查询 / 重置
- [ ] 空态文案
- [ ] 邀请 Sheet：邮箱/角色/备注校验；邮箱冲突提示
- [ ] 重发邀请（仅 invited）
- [ ] 启停；禁止停用当前管理员
- [ ] 导出 CSV：P1 或 Toast 演示

### 9.5 Settings

- [ ] 三分区切换
- [ ] 资料保存校验
- [ ] 通知偏好持久化
- [ ] MFA / 空闲退出开关（MFA 演示级）
- [ ] 改密校验
- [ ] 撤销非当前会话

---

## 10. 实现分期（对齐父 issue 子任务）

| Stage | Issue | 内容 | 依赖 |
|---|---|---|---|
| 1 | **AIL-33**（本文） | 设计文档评审 | — |
| 2 | AIL-34 | monorepo 脚手架、env、统一响应、README | 设计通过 + @全栈工程师 |
| 3 | AIL-35 | 鉴权 API + Auth 页 | AIL-34 |
| 3 | AIL-36 | Admin 壳层、主题、路由守卫 | AIL-34 |
| 4 | AIL-37 | Dashboard | Stage 3 |
| 4 | AIL-38 | 用户管理全栈 | Stage 3 |
| 4 | AIL-39 | 个人设置全栈 | Stage 3 |
| 5 | AIL-40 | 联调、视觉对照、README 交付 | Stage 4 |

Stage 3 两项可并行；Stage 4 三项可并行。

---

## 11. 环境变量（仅名，无真实值）

| 变量 | 用途 |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL |
| `JWT_SECRET` | JWT 签名 |
| `JWT_EXPIRES_IN` | 默认过期（如 `1d`） |
| `JWT_REMEMBER_EXPIRES_IN` | 记住登录（如 `14d`） |
| `PORT` | API 端口 |
| `CORS_ORIGIN` | 前端源 |
| `VITE_API_BASE_URL` | 前端 API 前缀（如 `/api`） |

---

## 12. 风险与已确认决策

| 项 | 结论 | 状态 |
|---|---|---|
| 邀请「接受」完整链路（邮件落地页） | 首期只建 `invited` 记录，**不做**接受页 / 设密激活 | **已确认**（2026-08-06） |
| `/` 路由 | **仅登录态分流重定向**（已登录 → `/dashboard`，未登录 → `/auth`）；不做导览落地页 | **已确认**（2026-08-06） |
| Session 表 vs 纯无状态 JWT | **有 Session 表**，支持撤销与改密失效 | 已选 |
| 仪表盘数据真伪 | seed/mock API | 已选 |
| 导出 CSV | P1，可用 Toast | 已选 |
| MFA | UI 开关入库，无 TOTP | 已选 |

### 评审结论

- 两项聚焦问题已锁定（见上表）。
- 人类已留下「通过」结论（2026-08-06）。
- 已收到评论中 **@ 全栈工程师** 实现触发；Stage 1 收尾完成，已提升 Stage 2（AIL-34）进入实现。

---

## 13. 验收标准（本设计任务）

- [x] 设计文档写入仓库：`docs/design/AIL-33.md`
- [x] 同步发在 issue 评论，便于评审
- [x] 覆盖全部原型页面与关键交互
- [x] API / Entity / 路由清单完整，不确定处标为假设
- [x] 人类评审通过并留下明确结论评论
- [x] 评审通过后评论中 @全栈工程师，方可进入 Stage 2+ 编码

---

## 14. 修订记录

| 日期 | 说明 |
|---|---|
| 2026-08-06 | 初稿：对照 `design/` 全页与父 issue Stage 1–5 |
| 2026-08-06 | 评审回复锁定：首期无邀请接受链路；`/` 仅登录态分流重定向 |
| 2026-08-06 | 人类确认「通过」；待 @ 全栈工程师后开工 |
| 2026-08-06 | 评审通过并 @；Stage 1 收尾，提升 AIL-34 |
