# 星枢 NovaOps 企业中后台开发模板 — 设计文档

> 仓库设计文件路径：`docs/design/ail-32-novaops-admin-template.md`  
> 高保真原型来源：`https://github.com/sce9966/shadcn-admin-ui` → `design/`（画布 1920×1080）  
> 产品名：星枢 NovaOps · 星海科技  
> 状态：待评审（请审查通过后再 @ 全栈工程师 开工）

---

## 1. 背景与目标

### 1.1 背景

项目 **shadcn-admin** 目标是沉淀一套企业级中后台开发模板。仓库 `sce9966/shadcn-admin-ui` 当前仅含高保真 HTML 原型（`design/`），尚无 Vue / NestJS 实现代码。原型已定义产品壳层、登录注册、仪表盘、用户管理与个人设置的信息架构与交互细节。

### 1.2 目标

在固定技术栈下，将原型落地为可运行的全栈脚手架模板，使后续业务模块可复用：

- 统一认证与租户（工作区）隔离
- 角色权限（admin / ops / viewer）
- 标准 Admin 布局壳（侧栏 + 顶栏 + 内容区）
- CRUD / 筛选 / 分页 / 表单校验 / Toast 等中后台范式
- 可复制的 Entity / API / Vue 页面分层约定

### 1.3 成功标准（产品视角）

对照原型四页（Auth / Dashboard / Users / Settings）完成可联调的最小闭环：注册创建工作区 → 登录 → 仪表盘只读指标 → 用户邀请与启停 → 个人资料/通知/安全设置。

---

## 2. 范围 / 非范围

### 2.1 范围（本期实现）

| 模块 | 说明 |
|------|------|
| 脚手架 | pnpm monorepo：`apps/web` + `apps/api`；环境变量示例；开发代理 |
| 认证 | 注册、登录、登出；JWT Access Token；密码哈希 |
| 工作区 | 注册时创建 Workspace（租户）；用户归属单一工作区（MVP） |
| 用户管理 | 列表筛选分页、邀请、重发邀请、启停用、导出 CSV（前端触发后端生成） |
| 仪表盘 | KPI + 调用量趋势 + 最近动态 + 快捷入口（可先聚合真实表 + 部分 mock 指标） |
| 个人设置 | 资料、通知偏好、改密、MFA 开关（MVP 可存开关位）、会话列表与撤销 |
| 布局壳 | 侧栏导航、面包屑、主题浅/深、通知入口（未读数可占位）、用户菜单 |
| UI | shadcn-vue + Tailwind，视觉对齐原型 token（黑白 accent、8px 圆角） |

### 2.2 非范围（本期不做）

- 多工作区切换 / 跨租户成员
- 细粒度 RBAC（菜单/按钮级权限矩阵、自定义角色模板数量「6」仅作营销展示）
- 真实审计日志存储与「导出审计」完整合规方案（可留接口占位）
- 忘记密码邮件实发、MFA 绑定完整 TOTP 流程（本期：开关 + 引导文案；完整绑定列为后续）
- 工单系统、对象存储配额计量、真实 API 网关调用量采集
- 移动端自适应（原型固定 1920×1080；实现以桌面为主，不阻塞小屏可用性即可）
- Figma / 设计系统包独立交付

### 2.3 假设（信息不足时的默认）

| # | 假设 |
|---|------|
| A1 | 仓库形态：**monorepo**，`apps/web` + `apps/api` |
| A2 | 包管理器：**pnpm** + `pnpm-workspace.yaml` |
| A3 | 鉴权：JWT **Access Token**；Refresh 列为可选二期。Access 传递优先 **Authorization: Bearer**，同时支持 httpOnly Cookie 方案二选一（实现时在 API 模块内统一，前端 axios 拦截器对齐） |
| A4 | 角色固定三档：`admin` / `ops` / `viewer`，不可自定义 |
| A5 | **Workspace = 租户**：注册时创建；邀请成员加入同一 Workspace |
| A6 | 原型演示账号 `demo@blocked.com` 映射为 `status=disabled` 用户的登录拒绝行为 |
| A7 | 仪表盘部分指标（工单、存储占用、接口调用量）无真实上游时，允许 **聚合 + 可配置 mock 开关**（`DASHBOARD_USE_MOCK=true`），但接口契约保持稳定 |
| A8 | 设计文档与实现以中文 UI 文案为准，与原型一致 |

---

## 3. 数据模型（表 / 字段 / 关系 / 索引）

> 引擎：MySQL 8+，`utf8mb4`。时间字段统一 `datetime(3)` UTC 存储，API 输出 ISO 8601。  
> 软删除：用户/会话用 `deleted_at`；工作区 MVP 不做删除。

### 3.1 ER 关系（逻辑）

```text
workspaces 1 ─── * users
workspaces 1 ─── * invitations
users 1 ─── * sessions
users 1 ─── 1 user_profiles
users 1 ─── 1 user_notification_prefs
users 1 ─── * activity_events（可选，仪表盘动态）
```

### 3.2 `workspaces`（工作区 / 租户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | bigint PK AI | | |
| name | varchar(128) | not null | 公司/工作区名称 |
| slug | varchar(64) | unique | 可选，由名称生成 |
| status | enum('active','suspended') | default active | |
| created_at | datetime(3) | | |
| updated_at | datetime(3) | | |

索引：`uk_workspaces_slug (slug)`

### 3.3 `users`

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | bigint PK AI | | |
| workspace_id | bigint | FK → workspaces.id, not null | 租户 |
| email | varchar(255) | not null | 工作邮箱 |
| password_hash | varchar(255) | not null | bcrypt/argon2 |
| display_name | varchar(64) | not null | |
| role | enum('admin','ops','viewer') | not null | |
| status | enum('active','invited','disabled') | not null | 与原型一致 |
| last_login_at | datetime(3) | null | |
| mfa_enabled | tinyint(1) | default 0 | MVP 开关 |
| idle_logout_minutes | int | null / 30 | 空闲退出；null=关闭 |
| created_at | datetime(3) | | |
| updated_at | datetime(3) | | |
| deleted_at | datetime(3) | null | 软删 |

索引：

- `uk_users_workspace_email (workspace_id, email)`
- `idx_users_workspace_status (workspace_id, status)`
- `idx_users_workspace_role (workspace_id, role)`

业务规则：

- 每个 Workspace 至少一名 `admin`；禁止停用「当前登录且为唯一 admin」或「当前登录的自己」（对齐原型：不能停用当前登录管理员）。
- `invited` 用户可无有效密码，接受邀请时设密并转 `active`（MVP：邀请即创建 `invited` 行，接受链接可二期；本期邀请后仍可「重发」）。

### 3.4 `user_profiles`

| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | bigint PK FK | |
| job_title | varchar(128) | 职位 |
| bio | varchar(512) | 简介 |
| updated_at | datetime(3) | |

### 3.5 `user_notification_prefs`

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| user_id | bigint PK FK | | |
| security_email | tinyint(1) | 1 | 安全告警邮件 |
| invite_result_email | tinyint(1) | 1 | 邀请结果 |
| weekly_digest_email | tinyint(1) | 0 | 运营周报 |
| updated_at | datetime(3) | | |

### 3.6 `invitations`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint PK AI | |
| workspace_id | bigint FK | |
| email | varchar(255) | |
| role | enum(...) | 预分配角色 |
| note | varchar(255) null | 备注 |
| token_hash | varchar(64) | 邀请令牌哈希 |
| invited_by | bigint FK users | |
| expires_at | datetime(3) | 默认 +7 天 |
| accepted_at | datetime(3) null | |
| created_at | datetime(3) | |

索引：`uk_invitations_token (token_hash)`；`idx_invitations_ws_email (workspace_id, email)`

### 3.7 `sessions`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint PK AI / uuid | |
| user_id | bigint FK | |
| refresh_token_hash | varchar(64) null | 若启用 refresh；否则可仅存 access jti |
| user_agent | varchar(512) | |
| ip | varchar(64) | |
| label | varchar(128) | 如「Chrome · Windows · 上海」 |
| is_current | 由请求上下文判断 | 不落库或落 jti |
| revoked_at | datetime(3) null | |
| last_seen_at | datetime(3) | |
| created_at | datetime(3) | |
| expires_at | datetime(3) | |

索引：`idx_sessions_user (user_id, revoked_at)`

### 3.8 `activity_events`（仪表盘「最近动态」，可选但推荐）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | bigint PK AI | |
| workspace_id | bigint FK | |
| actor_user_id | bigint null | |
| type | varchar(64) | 如 `role_joined`, `key_rotated`, `export_users`, `login_alert_closed` |
| title | varchar(255) | |
| summary | varchar(512) | |
| created_at | datetime(3) | |

索引：`idx_activity_ws_created (workspace_id, created_at DESC)`

---

## 4. API 契约

### 4.1 约定

- Base：`/api`（Nest `setGlobalPrefix('api')`）
- 统一响应：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- 分页：`data: { items, total, page, pageSize }`
- 字段：`camelCase`；时间 ISO 8601
- 鉴权：除注册/登录/健康检查外，均需 JWT；按 `workspace_id` 强制隔离
- 权限：`admin` 全量用户管理；`ops` 可查看用户、邀请（可选限制停用 admin）；`viewer` 只读

### 4.2 Auth

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 创建工作区 + 首个 admin 用户 |
| POST | `/api/auth/login` | 登录，返回 token（及可选 user） |
| POST | `/api/auth/logout` | 撤销当前会话 |
| GET | `/api/auth/me` | 当前用户 + workspace + 偏好摘要 |

**Register body**

```json
{
  "displayName": "陈思远",
  "organizationName": "星海科技",
  "email": "chen@xinghai.cn",
  "password": "Passw0rd",
  "acceptTerms": true
}
```

校验对齐原型：姓名/公司 ≥2；邮箱格式；密码 `(?=.*[A-Za-z])(?=.*\d).{8,}`；必须 `acceptTerms`。

**Login body**

```json
{
  "email": "chen@xinghai.cn",
  "password": "Passw0rd",
  "rememberMe": true
}
```

- `rememberMe=true`：更长过期（如 14 天，对齐「保持登录 14 天」）
- `status=disabled` → HTTP 403，`code` 业务码，文案：「该账号已被停用，请联系工作区管理员。」

### 4.3 Users（工作区内）

| 方法 | 路径 | 角色 | 说明 |
|------|------|------|------|
| GET | `/api/users` | admin, ops, viewer | 查询：`page,pageSize,keyword,role,status` |
| POST | `/api/users/invitations` | admin, ops | 邀请：`email, role, note?` |
| POST | `/api/users/invitations/:id/resend` | admin, ops | 重发 |
| PATCH | `/api/users/:id/status` | admin | `{ "status": "active" \| "disabled" }` |
| GET | `/api/users/export` | admin, ops | CSV 下载 |

邀请冲突：邮箱已在工作区 → 409。

### 4.4 Dashboard

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard/overview?range=7d\|30d\|90d` | KPI + 图表序列 |
| GET | `/api/dashboard/activities?limit=20` | 最近动态 |

`overview` 示例 `data`：

```json
{
  "range": "7d",
  "kpis": {
    "activeMembers": 128,
    "activeMembersDelta": "+6",
    "openTickets": 17,
    "loginSuccessRate": 98.6,
    "storageUsedTb": 2.4,
    "storageQuotaTb": 5
  },
  "apiCalls": {
    "caption": "近 7 天 · 按小时聚合",
    "labels": ["00", "02", "..."],
    "values": [42, 55, 48]
  }
}
```

无真实数据源时：服务端读 `DASHBOARD_USE_MOCK`，仍返回同结构。

### 4.5 Settings

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/PATCH | `/api/settings/profile` | 显示名称、职位、邮箱、简介 |
| GET/PATCH | `/api/settings/notifications` | 三个布尔开关 |
| POST | `/api/settings/password` | `{ currentPassword, newPassword }` |
| PATCH | `/api/settings/security` | `{ mfaEnabled, idleLogoutMinutes }` |
| GET | `/api/sessions` | 活动会话 |
| DELETE | `/api/sessions/:id` | 撤销（不可撤当前会话或需特殊处理） |

### 4.6 错误码（建议）

| code | HTTP | 场景 |
|------|------|------|
| 0 | 200 | 成功 |
| 40001 | 400 | 校验失败 |
| 40100 | 401 | 未登录/Token 无效 |
| 40300 | 403 | 无权限 |
| 40310 | 403 | 账号停用 |
| 40400 | 404 | 资源不存在 |
| 40901 | 409 | 邮箱已存在 |

---

## 5. 前端页面 / 交互要点

### 5.1 路由（建议）

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/auth` | 登录/注册（Tab） | 访客 |
| `/dashboard` | 仪表盘 | 登录 |
| `/users` | 用户管理 | 登录 |
| `/settings` | 个人设置（子 Tab：profile / notifications / security） | 登录 |
| `/` | 重定向 `/dashboard` 或 `/auth` | |

原型 `design/index.html` 仅为设计导航 Hub，**产品不实现**该入口页（或仅开发环境可选）。

### 5.2 布局壳（对齐 `design/js/layout.js`）

- 侧栏：品牌「星枢 NovaOps」、副标题「{workspace.name} · 生产环境」
- 导航分组：总览 → 仪表盘；组织 → 用户管理、个人设置
- 顶栏：面包屑、标题、搜索框（MVP 可本地过滤占位或隐藏）、主题切换、通知铃（占位 Toast）、用户菜单（设置 / 退出）
- 主题：`localStorage` key 可继续用 `novaops-theme`，同步 `html.dark` / CSS 变量（shadcn-vue 惯例）

### 5.3 Auth 页

- 左右分栏视觉可简化为 shadcn 卡片，但字段与校验文案对齐原型
- 密码可见性切换；错误字段 `is-invalid` 样式
- 成功后进入 `/dashboard`

### 5.4 Dashboard

- 范围 Pills：7d / 30d / 90d，切换时请求 `overview`
- KPI 四卡、柱状图（可用轻量图表库或纯 CSS/SVG）、动态列表、快捷操作跳转

### 5.5 Users

- 工具栏筛选：关键词、角色、状态；查询/重置
- 表格 + 空态「没有符合条件的成员。」
- 右侧 Drawer：邀请表单
- 行操作：重发邀请、启停；当前用户 admin 停用失败 Toast
- 导出 CSV

### 5.6 Settings

- 左垂直导航切换三个 Pane
- 表单底部保存条；会话列表撤销

### 5.7 组件优先使用 shadcn-vue

Button、Input、Label、Form、Table、Dialog/Sheet（Drawer）、DropdownMenu、Tabs、Switch、Badge、Sonner/Toast、Pagination、Card、Select、Checkbox。

---

## 6. 关键流程

### 6.1 注册创建工作区

```text
用户填写注册表 → POST /auth/register
  → 事务：insert workspace + insert user(admin, active) + profile + notify prefs
  → 签发 JWT + 写 session
  → 前端进入 /dashboard
```

### 6.2 登录

```text
POST /auth/login
  → 校验邮箱密码与 status
  → 更新 last_login_at；写 session
  → 返回 token
```

### 6.3 邀请成员

```text
admin/ops 打开 Drawer → POST /users/invitations
  → 校验邮箱未占用
  → insert invitation + insert/更新 user(status=invited)
  → （可选）发邮件；MVP Toast「邀请已发送」
  → 列表刷新出现「待接受」
```

### 6.4 启停用户

```text
PATCH /users/:id/status
  → 禁止操作自己；禁止去掉最后一名 admin
  → 写 activity_events
```

### 6.5 改密与会话撤销

```text
POST /settings/password → 校验当前密码 → 更新 hash → 可选撤销其他 sessions
DELETE /sessions/:id → revoked_at = now → 该 refresh/access 失效
```

### 6.6 租户隔离（横切）

所有业务查询必须带 `workspace_id = currentUser.workspaceId`；禁止仅凭资源 id 跨租户访问。

---

## 7. 风险与待决事项

### 7.1 风险

| 风险 | 影响 | 缓解 |
|------|------|------|
| 仪表盘指标无真实数据源 | 验收争议 | Mock 开关 + 契约先行；文档标明占位 |
| 仅 Access Token 无 Refresh | 体验与安全权衡 | 默认较短 TTL + rememberMe 延长；二期 Refresh |
| 邀请接受链路未做 | invited 用户无法自助激活 | MVP 管理员代设或二期邮件链接 |
| MFA 仅开关 | 安全能力不完整 | 验收标注「开关可用，绑定流程二期」 |
| 原型固定画布 vs 响应式 | 实现偏差 | 桌面优先，关键断点不崩即可 |
| Shell/运行时不稳定导致无法 checkout 双写 | 仓库文件滞后 | 先写工作区 `docs/design/`，checkout 后同步 |

### 7.2 待决（最多请评审拍板）

1. **Token 存放**：Bearer（localStorage/memory）还是 **httpOnly Cookie**？默认建议：**Bearer + memory/pinia**（模板简单）；若安全优先则 Cookie。
2. **邀请接受**：本期是否必须「邮件链接设密激活」，还是允许停留在 `invited` 演示态？

（其余按上文假设 A1–A8 执行，若不同意请在评审中标注。）

---

## 8. 验收标准

### 8.1 工程

- [ ] `pnpm install` 后 `pnpm dev:api` / `pnpm dev:web` 可启动
- [ ] 提供 `apps/api/.env.example`、`apps/web/.env.example` 与 README 启动步骤
- [ ] TypeORM：开发可用 synchronize 或 migration 二选一写清；至少提供实体与索引

### 8.2 功能对照原型

- [ ] 登录/注册校验规则与错误态符合原型要点
- [ ] 停用账号无法登录
- [ ] 登录后壳层导航：仪表盘 / 用户管理 / 个人设置；主题切换持久化
- [ ] 仪表盘：三档 range 切换 KPI/图表；动态列表有数据（真实或 mock）
- [ ] 用户：筛选、邀请 Drawer、重发、启停、导出；不能停用当前管理员
- [ ] 设置：三 Pane；资料保存；通知开关；改密；会话撤销
- [ ] 角色：viewer 不能邀请/停用（403）

### 8.3 质量

- [ ] API 统一响应结构；前端错误 Toast 可读
- [ ] 租户隔离抽测：用户 A 无法读写用户 B 工作区数据
- [ ] 关键路径无明文密码落库；密码哈希存储

### 8.4 流程门禁

- [ ] 本设计经 [@Sce huang](mention://member/11a6f825-72c8-4e6b-abe3-97cc84589529) 评审通过
- [ ] 通过后须 **@全栈工程师** 才可开始编码；仅有「LGTM」而无 @ 不得开工

---

## 附录 A. 原型文件索引

| 原型文件 | 对应实现 |
|----------|----------|
| `design/index.html` | 不实现（设计导航） |
| `design/auth.html` | `/auth` |
| `design/dashboard.html` | `/dashboard` |
| `design/users.html` | `/users` |
| `design/settings.html` | `/settings` |
| `design/js/layout.js` | `layouts/AdminLayout.vue` |
| `design/css/admin.css` | Tailwind + shadcn CSS 变量 |

## 附录 B. 建议目录（实现阶段）

```text
.
├── apps/web/src/{api,layouts,views,router,stores,components/ui}
├── apps/api/src/modules/{auth,users,workspaces,dashboard,settings,sessions}
├── docs/design/ail-32-novaops-admin-template.md
├── package.json
└── pnpm-workspace.yaml
```

---

**请评审者确认后，@ 全栈工程师（Agent）再进入编码阶段。** 若需调整 Token 策略或邀请接受链路，请直接批注本文件对应小节。
