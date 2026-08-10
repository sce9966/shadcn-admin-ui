# AIL-38 用户管理全栈（列表 / 筛选 / 邀请 / 启停）— 设计文档

> Issue：AIL-38 · 父任务：AIL-32 · Stage 4（与 AIL-37 / AIL-39 可并行）  
> 原型基线：`design/users.html`  
> 总设计依据：`docs/design/AIL-33.md` §4–§5.3、§7、§9；鉴权落地：`docs/design/AIL-35.md`  
> 仓库设计文件路径：`docs/design/AIL-38.md`  
> 状态：评审通过 · 实现中

---

## 1. 背景与目标

### 1.1 背景

Stage 3（AIL-35 鉴权 + AIL-36 壳层）已完成：`User` / `Organization` / `Session` 实体与 JWT 守卫可用；`/users` 路由挂在 `AdminLayout` 下，内容为 `UsersPlaceholderView`。总设已约定成员管理 API 与权限矩阵；本 issue 将其落地为可联调全栈能力，并对齐 `design/users.html` 关键结构。

### 1.2 目标

1. 后端提供组织内成员列表（关键词 / 角色 / 状态筛选 + 分页）、邀请、重发邀请、启停状态切换。
2. 前端替换占位页：页头、工具栏、表格、分页、邀请 Sheet、行操作、Toast。
3. 角色 / 状态枚举与原型一致：`admin` / `ops` / `viewer`；`active` / `invited` / `disabled`。
4. 所有查询与写操作强制绑定当前用户 `organizationId`，禁止跨租户。

---

## 2. 范围 / 非范围

### 2.1 范围内（本 issue · P0）

| 层 | 项 |
|---|---|
| 数据 | 复用既有 `users` 表；`password_hash` 改为可空（供 `invited`）；补索引 `idx_users_org_status` / `idx_users_org_role`（开发期 synchronize） |
| API | `GET /api/users`、`POST /api/users/invites`、`POST /api/users/:id/resend-invite`、`PATCH /api/users/:id/status` |
| 权限 | 列表：登录即可；邀请 / 重发 / 启停：**仅 admin**（对齐 AIL-33 §4.4） |
| 前端 | `UsersView` + 工具栏 / 表格 / 分页 / InviteSheet；路由替换占位 |
| UX | 加载态、空态、表单校验、Toast；对齐原型交互语义 |

### 2.2 非范围 / P1

| 项 | 说明 |
|---|---|
| 邀请邮件真实发送 / 接受落地页 | AIL-33 已确认首期不做；重发仅刷新 `invite_expires_at` + Toast |
| 导出 CSV 真实下载 | **P1**：按钮保留，前端 Toast「导出演示」或后端 `501`；不阻塞验收 |
| 改他人角色 UI | 总设首期不做 |
| 独立 `invitations` 表 | 不建；邀请即 `users` 行（`status=invited`） |
| Dashboard / Settings 业务 | AIL-37 / AIL-39 |
| 生产 Migration 流水线 | 仍走开发 synchronize；正式 migration 留给 AIL-40 或后续 |

### 2.3 假设（评审可改）

| # | 假设 |
|---|---|
| H1 | API 路径采用 **AIL-33** 约定（`/invites`、`/:id/resend-invite`），不以早期 `ail-32-novaops` 草案中的 `/invitations` 为准。 |
| H2 | 邀请 / 重发 / 启停 **仅 admin**；ops/viewer 可见列表与只读表格，写操作按钮隐藏或点击返回 403。 |
| H3 | `password_hash` 对 `invited` 用户为 `NULL`；登录已按空 hash 拒绝（AIL-35）。 |
| H4 | 邀请创建的 `name` 取邮箱 `@` 前本地部分（截断至 64）；`initial` 由前端从 `name` 派生，不入库。 |
| H5 | 默认分页 `page=1`，`pageSize=10`（上限 100）；原型演示数据少，分页控件仍实现。 |
| H6 | 「导出 CSV」本期保持演示 Toast，与原型一致。 |
| H7 | 启停：`disabled → active`；`active|invited → disabled`；禁止停用**当前登录用户**；禁止将状态改为 `invited`。 |

---

## 3. 数据模型

### 3.1 实体变更（相对 AIL-35 现状）

既有 `User` 实体已含 `role` / `status` / `inviteNote` / `inviteExpiresAt` / `lastLoginAt`。本 issue仅做：

| 变更 | 说明 |
|---|---|
| `passwordHash` nullable | `varchar(255) NULL`；`invited` 无密码 |
| 索引 | 增加 `@Index('idx_users_org_status', ['organizationId','status'])`、`@Index('idx_users_org_role', ['organizationId','role'])` |
| 保留 | `uk_users_email` 全局唯一（AIL-35 已落地）；邀请邮箱冲突按全局唯一处理 |

**不新增表。**

### 3.2 邀请字段语义

| 字段 | 邀请创建时 | 重发时 |
|---|---|---|
| `status` | `invited` | 不变（须仍为 `invited`） |
| `role` | 请求体指定 | 不变 |
| `invite_note` | 可选 | 不变 |
| `invite_expires_at` | `now + 7d` | 重置为 `now + 7d` |
| `password_hash` | `NULL` | 不变 |
| `name` | email local-part | 不变 |
| `last_login_at` | `NULL` | 不变 |

### 3.3 状态机（管理侧）

```text
[邀请] ──► invited ──(管理员启停)──► disabled
              │                         │
              │ (首期无自助接受)          │ (启用)
              ▼                         ▼
           （二期 active）◄────────── active ◄──► disabled
```

首期管理员可将 `disabled` 启回 `active`（含曾为 invited 后被停用的账号）；**不提供**管理侧「代激活 invited→active」专用入口（若产品需要可在评审改为允许 PATCH `active` 于 invited，见待决）。

**本 issue PATCH 契约**：`status` 仅允许 `active` | `disabled`（见 H7）。对 `invited` 行：传 `disabled` 可停用；传 `active` 在首期 **拒绝**（400），避免无密码账号被标为可登录。若评审要求「管理员代激活」，再放开并约定临时密码策略。

---

## 4. API 契约

### 4.1 约定

- 前缀 `/api`；统一响应 `{ code, message, data }`（既有 interceptor / filter）。
- 鉴权：`Authorization: Bearer`；租户：`organizationId = currentUser.organizationId`。
- 分页：`data: { items, total, page, pageSize }`。
- id 序列化为 string（与 auth 一致）。

### 4.2 接口一览

| 方法 | 路径 | 角色 | 说明 |
|---|---|---|---|
| GET | `/api/users` | 登录用户 | 列表 + 筛选 + 分页 |
| POST | `/api/users/invites` | admin | 邀请成员 |
| POST | `/api/users/:id/resend-invite` | admin | 重发（仅 invited） |
| PATCH | `/api/users/:id/status` | admin | 启停 |
| GET | `/api/users/export` | — | **本期不做**；若误触可 501 |

### 4.3 `GET /api/users`

**Query**

| 参数 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `keyword` | string | — | 匹配 `name` / `email`（LIKE，大小写不敏感优先） |
| `role` | `admin\|ops\|viewer` | — | 缺省或不传 = 全部 |
| `status` | `active\|invited\|disabled` | — | 缺省 = 全部 |
| `page` | int ≥ 1 | 1 | |
| `pageSize` | int 1–100 | 10 | |

**`items[]` 字段**

```json
{
  "id": "1",
  "name": "陈思远",
  "email": "chen@xinghai.cn",
  "role": "admin",
  "status": "active",
  "lastLoginAt": "2026-08-10T01:14:00.000Z",
  "createdAt": "2026-08-01T00:00:00.000Z"
}
```

`lastLoginAt` 为 null 时前端展示「—」。`roleLabel` / `statusLabel` / `initial` **不由后端返回**，前端映射。

**排序**：`createdAt DESC`，同组织内稳定。

### 4.4 `POST /api/users/invites`

**Body**

```json
{ "email": "name@company.com", "role": "ops", "note": "可选备注" }
```

| 字段 | 校验 |
|---|---|
| `email` | 必填；email 格式；trim + lower |
| `role` | 必填；`admin\|ops\|viewer` |
| `note` | 可选；≤ 512 |

**成功**：`201` 或 `200` + `data` 为新建用户摘要（同列表项）。  
**冲突**：同邮箱已存在 → `409`，「该邮箱已在工作区中」或「该邮箱已被注册」（与全局唯一一致）。  
**权限**：非 admin → `403`。

### 4.5 `POST /api/users/:id/resend-invite`

- 目标须属本组织且 `status=invited`，否则 `404` / `400`。
- 更新 `invite_expires_at = now + 7d`。
- 成功 Toast 文案由前端：`已向 {email} 重发邀请`（后端可返回 `{ id, email, inviteExpiresAt }`）。

### 4.6 `PATCH /api/users/:id/status`

**Body**：`{ "status": "active" | "disabled" }`

| 规则 | 行为 |
|---|---|
| 目标不存在或不在本组织 | 404 |
| `id === currentUser.id` | 400/403：「不能停用当前登录账号」 |
| 当前 `invited` 且目标 `active` | 400：「待接受邀请的成员无法直接启用，请等待接受或重新邀请」 |
| 当前 `invited` 且目标 `disabled` | 允许 |
| `disabled` → `active` | 允许（须已有 `password_hash`；若无则 400） |
| `active` → `disabled` | 允许；可选：吊销该用户全部未过期 session（**建议做**，防停用后 token 仍可用） |

---

## 5. 后端模块结构

```text
apps/api/src/modules/users/
  users.module.ts
  users.controller.ts
  users.service.ts
  dto/
    list-users.query.dto.ts
    invite-user.dto.ts
    update-user-status.dto.ts
  guards/ 或复用 auth
    roles.decorator.ts   # @Roles('admin')
    roles.guard.ts
```

| 步骤 | 说明 |
|---|---|
| 1 | Entity 可空密码 + 索引 |
| 2 | `UsersModule` 注册，`AppModule` 导入 |
| 3 | `RolesGuard`：读 JWT payload / `req.user.role` |
| 4 | Service：QueryBuilder 过滤 + 事务邀请 |
| 5 | 停用时批量 `sessions.revoked_at = now`（同用户） |

复用：`JwtAuthGuard`（全局）、`@CurrentUser()`、统一异常文案风格（中文）。

---

## 6. 前端页面 / 交互

### 6.1 文件规划

```text
apps/web/src/
  api/users.ts
  types/users.ts
  views/users/UsersView.vue          # 替换 UsersPlaceholderView
  components/users/
    UsersToolbar.vue                 # 筛选 + 导出
    UsersTable.vue                   # 表格 + 行操作
    UsersPagination.vue
    InviteMemberSheet.vue            # Sheet 对齐原型 drawer
  lib/user-labels.ts                 # role/status 中文与 badge class
```

路由：`router` 中 `/users` component 改为 `UsersView`；`meta.title` 仍为「用户管理」。

### 6.2 页面结构（对齐原型）

1. **页头**：标题「成员与权限」+ 描述；右侧「邀请成员」（仅 admin 显示）。
2. **面板工具栏**：关键词、角色、状态、查询、重置；右侧「导出 CSV」。
3. **表格列**：成员（Avatar + 姓名/邮箱）、角色、状态 Badge、最近登录、操作。
4. **空态**：「没有符合条件的成员。」
5. **分页**：`显示 {from}–{to} / 共 {total}` + 上一页 / 下一页。
6. **邀请 Sheet**（shadcn `Sheet`）：邮箱、角色 Select、备注 Textarea；取消 / 发送邀请。

### 6.3 交互要点

| 操作 | 行为 |
|---|---|
| 查询 | 提交筛选 → 重置到 page=1 → 请求列表 → Toast「已查询到 N 名成员」 |
| 重置 | 清空控件 → 默认筛选 → 刷新 → Toast「已重置筛选条件」 |
| 导出 | Toast 演示（P1） |
| 重发 | 仅 `invited` 可点；成功 Toast |
| 启停 | 文案：disabled 显示「启用」，否则「停用」；失败展示后端 message |
| 邀请 | 前端 email 校验；409 时字段级错误「该邮箱已在工作区中」；成功关闭 Sheet 并刷新列表 |

### 6.4 shadcn-vue 组件

已有：Button、Input、Label、Sheet、Avatar、Badge（若无则 `add badge`）、Sonner、Select（若无则 `add select`）、Table（若无则 `add table`）、Textarea。

优先复用现有 `components/ui`，缺什么再 `pnpm dlx shadcn-vue@latest add`。

### 6.5 权限 UI

- `authStore.user.role !== 'admin'`：隐藏「邀请成员」、行内重发/启停；导出可仍显示演示。
- 后端仍强制校验，防绕过。

---

## 7. 关键流程

### 7.1 列表

```text
进入 /users
  → GET /api/users?page=1&pageSize=10
  → 渲染表格 / 空态
筛选提交
  → GET /api/users?...filters
```

### 7.2 邀请

```text
admin 打开 Sheet → 校验邮箱
  → POST /api/users/invites
  → 201：关闭 Sheet、刷新列表、Toast
  → 409：字段错误
```

### 7.3 重发 / 启停

```text
POST /api/users/:id/resend-invite → Toast
PATCH /api/users/:id/status → 刷新行或整表 → Toast
```

### 7.4 租户隔离

Service 层所有 `where` 必须含 `organizationId = currentUser.organizationId`；禁止仅凭 `:id` 更新。

---

## 8. 风险与待决事项

### 8.1 风险

| 风险 | 缓解 |
|---|---|
| `password_hash` 改可空后旧库 synchronize 行为 | 开发库可重建；文档说明 |
| 停用后 JWT 仍有效 | 停用时吊销 sessions |
| ops 权限与早期草案不一致 | 以 AIL-33 为准，本设计写明 |
| 全局邮箱唯一导致「他组织同邮箱无法邀请」 | 沿用 AIL-35；文案提示已被注册 |

### 8.2 待决（最多请确认两项）

1. **invited → active**：首期是否禁止管理员直接启用（本设计默认禁止）？若需放开，是否同时要求设置临时密码？
2. **导出 CSV**：确认本期仅前端演示 Toast，不实现 `GET /api/users/export`？

---

## 9. 验收标准

- [ ] 列表支持关键词 / 角色 / 状态筛选与分页，数据仅当前组织。
- [ ] admin 可邀请成员，列表出现 `status=invited` 行；邮箱冲突有明确错误。
- [ ] admin 可对 `invited` 重发邀请（刷新过期时间）。
- [ ] admin 可启停成员；不可停用自己；停用后该账号无法登录（既有 auth + session 吊销）。
- [ ] ops/viewer 可看列表，不可邀请/重发/启停（UI + API）。
- [ ] UI 具备工具栏、表格、邀请抽屉（Sheet）、Toast，结构对齐 `design/users.html`。
- [ ] 无密钥 / 明文密码入库；响应不含 `passwordHash`。

---

## 10. 实现顺序（评审通过且 @ 全栈工程师后）

1. Entity 调整（nullable password + 索引）
2. `RolesGuard` + `UsersModule` API
3. 前端 `api/users` + `UsersView` 拼装
4. 权限显隐与边界自测
5. 提交 PR（标题含 `AIL-38`，body `Closes AIL-38`）

---

## 11. 与总设偏差说明

| 点 | 总设 / 草案 | 本设计 |
|---|---|---|
| 邀请路径 | AIL-33：`/users/invites`；早期文稿曾写 `/invitations` | 采用 AIL-33 |
| 邀请权限 | AIL-33：仅 admin；早期文稿曾含 ops | 仅 admin |
| 导出 | AIL-33：P1 | 前端演示 Toast，不实现 API |
| invited 启用 | 未细写 | 默认禁止 PATCH 为 active |

评审通过后请在本 issue 评论中 **@全栈工程师**，我再开始编码。
