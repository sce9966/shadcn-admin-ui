# AIL-39 设计：个人设置全栈（资料 / 通知 / 安全）

> Issue：AIL-39 · 父任务：AIL-32 · 总设：`docs/design/AIL-33.md`  
> 原型基线：`design/settings.html`  
> 依赖：Stage 3 完成（AIL-35 鉴权 + AIL-36 壳层）  
> 仓库设计文件路径：`docs/design/AIL-39.md`  
> 状态：**实现中**（2026-08-10 评审触发编码；H3/H7 已确认）

---

## 1. 背景与目标

### 1.1 背景

Stage 3 已落地：JWT + Session、`User` / `Organization` / `Session` 实体、Admin 壳层与 `/settings` 占位页（`SettingsPlaceholderView`）。总设 AIL-33 §5.4 已给出 Me / Settings API 草案；高保真原型 `design/settings.html` 定义了三分区 UI 与交互校验。本 issue 将草案收敛为可联调实现。

### 1.2 目标

1. 替换设置占位页，UI / 交互对齐 `design/settings.html`（分区导航、资料表单、通知开关、安全区含改密与会话）。
2. 落地 `/api/me/*` 读写能力：资料更新、通知偏好持久化、安全开关、改密、活动会话列表与撤销。
3. 与现有鉴权闭环衔接：改密吊销全部会话并强制重新登录；撤销非当前会话立即生效；资料变更后刷新顶栏用户菜单展示。

---

## 2. 范围与非范围

### 2.1 范围内（本 issue）

| 域 | 内容 |
|---|---|
| 数据 | 新增 `user_preferences` Entity；复用 `users`（`name/title/email/bio/mfa_enabled/idle_logout`）与 `sessions`；开发期继续 `synchronize: true` |
| API | `PATCH /api/me/profile`、`GET|PATCH /api/me/preferences`、`PATCH /api/me/security`、`POST /api/me/password`、`GET /api/me/sessions`、`DELETE /api/me/sessions/:id`；扩展 `GET /api/auth/me` 返回资料字段 |
| 后端模块 | Nest `MeModule`（controller / service / dto）；权限：任意已登录且 `active` 用户仅可操作本人 |
| 前端 | `SettingsView` + 分区组件；`api/me.ts`；路由 `?tab=`；校验与 Toast 对齐原型 |
| shadcn | 按需新增 `Switch`、`Textarea`、`Badge`、`Card`（若仓库尚无） |

### 2.2 非范围

| 项 | 说明 |
|---|---|
| 真实邮件通知投递 | 偏好仅持久化开关；不接 SMTP（与总设一致） |
| 完整 MFA / TOTP 绑定校验 | UI 开关入库 + Toast 演示文案；不做密钥签发 / 校验 |
| 空闲退出的服务端强制 | `idleLogout` 入库；**前端** 30 分钟无操作后登出（演示级） |
| 会话地理 / 设备指纹精修 | `label` 由 `userAgent` 启发式解析；城市可固定或省略，不做 GeoIP |
| 头像上传 | 原型无上传控件；继续用姓名首字 Avatar |
| Dashboard / 用户管理业务页 | AIL-37 / AIL-38 |
| 生产 migration 流水线 | 与 AIL-35 一致：开发 synchronize；migration 留给 AIL-40 或附说明 |

### 2.3 假设（评审可改）

| # | 假设 | 推荐 |
|---|---|---|
| H1 | 通知偏好用独立表 `user_preferences`（对齐总设），首次 `GET` 时若不存在则按默认值懒创建 | **采用** |
| H2 | 邮箱变更仍受**全局唯一**约束（AIL-35）；冲突返回 409「该邮箱已被注册」 | **采用** |
| H3 | 改密成功后：**吊销该用户全部未吊销会话（含当前）**；前端清 token 并跳转 `/auth` 强制重新登录；Toast：「密码已更新，请重新登录」 | **已确认**（2026-08-10） |
| H4 | 不可撤销当前会话：`DELETE` 当前 session → 400「不能撤销当前会话」 | **采用**（对齐总设；与改密「吊销全部」不冲突——主动撤销列表仍禁撤当前） |
| H5 | 分区用 query `?tab=profile\|notify\|security`，缺省 `profile`；刷新可恢复 | **采用** |
| H6 | `GET /api/auth/me` 扩展返回 `bio`、`mfaEnabled`、`idleLogout`，避免再开 profile GET | **采用** |
| H7 | 会话列表项展示：仅 `浏览器 · 系统` + IP；**不展示城市** | **已确认**（2026-08-10） |

---

## 3. 数据模型

### 3.1 ER（本 issue增量）

```text
Organization 1──* User          （已有）
User 1──* Session               （已有）
User 1──1 UserPreference        （新增）
```

### 3.2 复用 `users`（已有字段，本 issue 开始写入）

| 字段 | 用途 |
|---|---|
| `name` / `title` / `email` / `bio` | 个人资料 |
| `password_hash` | 改密（bcrypt） |
| `mfa_enabled` | 安全区 MFA 开关（演示级） |
| `idle_logout` | 空闲自动退出开关（默认 `true`） |

无需新增 users 列。

### 3.3 复用 `sessions`（已有）

| 字段 | 列表用途 |
|---|---|
| `id` | 撤销目标 |
| `user_agent` / `ip` | 展示文案 |
| `created_at` / `expires_at` / `revoked_at` | 过滤未吊销且未过期；「N 天前」相对 `created_at` |
| `token_jti` | 与当前 JWT `jti` 比较 → `isCurrent` |

**不新增** `label` 列：展示标签在 Service 层由 UA 解析生成。

### 3.4 新增 `user_preferences`

| 字段 | 类型 | 说明 |
|---|---|---|
| `user_id` | bigint PK FK → users.id ON DELETE CASCADE | |
| `notify_security` | boolean | 默认 `true`；安全告警邮件 |
| `notify_invite` | boolean | 默认 `true`；成员邀请结果 |
| `notify_weekly` | boolean | 默认 `false`；每周运营周报 |
| `updated_at` | datetime | |

索引：主键即 `user_id`，无需额外索引。

### 3.5 同步策略

- 开发：`synchronize: true`（现有脚手架）。
- 不在本 issue 强制完整 migration；若评审要求，可附 `docs` 说明表结构供 AIL-40。

---

## 4. API 契约

### 4.1 约定（沿用）

- 前缀 `/api`；统一 `{ code, message, data }`；`Authorization: Bearer`
- 字段 `camelCase`；id 字符串；时间 ISO 8601
- 仅操作当前登录用户；无需角色校验（admin/ops/viewer 均可改自己）

### 4.2 扩展 `GET /api/auth/me`

在现有 `AuthUserView` 上增加：

```json
{
  "id": "1",
  "name": "陈思远",
  "email": "chen@xinghai.cn",
  "role": "admin",
  "status": "active",
  "title": "产品运营负责人",
  "bio": "负责星枢工作区的运营策略与成员治理。",
  "mfaEnabled": false,
  "idleLogout": true,
  "organization": { "id": "1", "name": "星海科技" }
}
```

实现时从 DB 重读 User（勿仅信 JWT payload），保证资料页拿到最新值。

### 4.3 Me 端点

| 方法 | 路径 | Body / 说明 |
|---|---|---|
| PATCH | `/api/me/profile` | `{ name, title, email, bio? }` → 返回更新后的用户摘要（同 me 形，可无 org 或含 org） |
| GET | `/api/me/preferences` | → `{ notifySecurity, notifyInvite, notifyWeekly }` |
| PATCH | `/api/me/preferences` | 同上字段（均可选，至少一项）→ 返回完整偏好 |
| PATCH | `/api/me/security` | `{ mfaEnabled?, idleLogout? }` → `{ mfaEnabled, idleLogout }` |
| POST | `/api/me/password` | `{ currentPassword, newPassword }` → `{ ok: true }` |
| GET | `/api/me/sessions` | → `{ items: SessionItem[] }` |
| DELETE | `/api/me/sessions/:id` | → `{ ok: true }` |

#### `SessionItem`

```json
{
  "id": "12",
  "label": "Chrome · Windows",
  "ip": "10.2.18.44",
  "isCurrent": true,
  "createdAt": "2026-08-08T02:00:00.000Z",
  "lastSeenHint": "当前会话"
}
```

`lastSeenHint`：当前会话固定「当前会话」；否则相对时间文案（如「2 天前」），由后端或前端格式化均可——**推荐后端给 `createdAt`，前端格式化**，`lastSeenHint` 可选。

### 4.4 校验规则（对齐原型）

| 场景 | 规则 |
|---|---|
| 显示名称 | trim 后长度 ≥ 2，≤ 64 |
| 职位 | trim 后长度 ≥ 2，≤ 128 |
| 邮箱 | 合法 email；小写规范化；全局唯一 |
| 简介 | 可选；建议 ≤ 500 字符 |
| 当前密码 | 必填；bcrypt 比对失败 → 400「当前密码不正确」 |
| 新密码 | ≥ 8 且同时含字母与数字（与注册一致）；≠ 当前密码（推荐） |
| 确认新密码 | **仅前端**校验一致 |

### 4.5 错误示例

| HTTP | message |
|---|---|
| 400 | 字段校验失败文案 / 「当前密码不正确」 / 「不能撤销当前会话」 |
| 404 | 会话不存在或不属于当前用户 |
| 409 | 「该邮箱已被注册」 |
| 401 | 未登录 / 会话已吊销（既有守卫） |

### 4.6 改密副作用（强制重新登录）

1. 校验当前密码与新密码规则。
2. 更新 `password_hash`。
3. `UPDATE sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL`（**含当前 jti**）。
4. 返回 `{ ok: true }`。
5. 前端：Toast「密码已更新，请重新登录」→ 清除 `novaops_access_token`（local/sessionStorage）与 auth store → 跳转 `/auth`（可不调用 logout API，会话已全部吊销）。

---

## 5. 前端页面与交互

### 5.1 路由与结构

| 项 | 约定 |
|---|---|
| 路径 | `/settings`（已有，挂 `AdminLayout`） |
| 组件 | `views/settings/SettingsView.vue` 替换 `SettingsPlaceholderView` |
| 子组件 | `SettingsNav`、`ProfilePane`、`NotifyPane`、`SecurityPane`（或内聚于 View，保持 diff 小） |
| API | `apps/web/src/api/me.ts` |
| Tab | `route.query.tab`；点击分区 `router.replace({ query: { tab } })` |

### 5.2 布局（对齐原型）

```text
page-head：账户与偏好 + 副标题
settings-layout：左 220px 分区导航 | 右 panel
  - 个人资料：双列表单 + 重置 / 保存资料
  - 通知偏好：三 Switch 行 + 保存通知设置
  - 登录安全：MFA / 空闲退出 Switch；改密表单；活动会话列表
```

壳层（侧栏 / 顶栏 / 主题 / 用户菜单）已由 AIL-36 提供，本页只做 content 区。

### 5.3 交互要点

| 操作 | 行为 |
|---|---|
| 保存资料 | 前端校验 → PATCH profile → Toast「个人资料已保存」→ 更新 `useAuthStore` 用户信息 |
| 重置 | 恢复为进入页 / 上次成功加载的快照（非空表单） |
| 保存通知 | PATCH preferences → Toast 汇总已开启项（文案对齐原型脚本） |
| MFA 开关 | 即时 PATCH security → Toast 演示文案（开启：「请使用身份验证器完成 MFA 绑定（演示）」） |
| 空闲退出开关 | 即时 PATCH security；开启时启动前端 idle 计时（30min），触发 logout |
| 更新密码 | 校验 → POST password → Toast「密码已更新，请重新登录」→ 清 token → `/auth` |
| 撤销会话 | DELETE → 移除列表项 → Toast「已撤销该会话」；当前行展示 Badge「当前」，无撤销按钮 |

### 5.4 加载与错误

- 进入页：并行 `fetchMe` + `getPreferences` + `listSessions`；分区级或整页 loading。
- 失败：Toast 错误 message；表单 `is-invalid` 对齐原型字段级提示。
- 未登录：既有路由守卫拦截。

### 5.5 组件清单

| 用途 | 组件 |
|---|---|
| 已有 | Button、Input、Label、Separator、Badge（若无则 add）、Avatar、Sonner |
| 新增（按需） | Switch、Textarea、Card |

---

## 6. 关键流程

```text
已登录用户
  → 侧栏 / 用户菜单进入 /settings
  → 默认 tab=profile，拉取 me + preferences + sessions
  → 改资料 / 偏好 / 安全 / 密码 / 撤销会话
  → Toast 反馈；顶栏名邮同步
```

改密后：当前端与其他设备会话均立即失效；当前端主动跳转 `/auth`；其他设备下次请求 401 → 跳转 `/auth`（沿用 http 拦截器）。

---

## 7. 后端实现要点（编码阶段指引）

| 项 | 说明 |
|---|---|
| 模块 | `apps/api/src/modules/me/`：`me.module.ts` / `me.controller.ts` / `me.service.ts` / `dto/*` |
| Entity | `user-preference.entity.ts`；`AppModule` TypeORM entities 注册 |
| 守卫 | 沿用全局 `JwtAuthGuard`；全部 me 路由需登录 |
| 当前用户 | `@CurrentUser()` 取 `AuthUserPayload`（含 `jti`） |
| UA 解析 | 轻量启发式即可（含 Chrome/Safari/Firefox + Windows/macOS/iPhone/Android）；未知则「未知设备」 |
| 密码 | `bcryptjs` cost 10，与 Auth 一致 |

---

## 8. 风险与待决

| 风险 / 待决 | 缓解 |
|---|---|
| `auth/me` 扩展是否破坏前端类型 | 同步改 `AuthUser` 类型与 store；字段只增不删 |
| 空闲退出误伤长页面阅读 | 监听 `mousemove` / `keydown` / `click` 重置计时；仅 `idleLogout===true` 生效 |
| 与 AIL-38 并行改 User | 本 issue 只写本人资料字段与 preferences；避免改邀请/status API |
| 通知无真实投递导致「假持久化」误解 | 设计与 README（AIL-40）标明：开关入库，不发信 |

**已确认（2026-08-10 [@Sce huang](mention://member/11a6f825-72c8-4e6b-abe3-97cc84589529)）：**

1. H3：改密后强制重新登录（吊销全部会话 + 清 token + `/auth`）。
2. H7：会话展示仅 `浏览器 · 系统` + IP，不展示城市。

---

## 9. 验收标准

- [ ] `/settings` 三分区切换与原型一致；`?tab=` 可深链
- [ ] 资料保存成功有 Toast，校验失败标红；顶栏用户信息更新
- [ ] 通知三开关可 PATCH 持久化，刷新后保持
- [ ] 安全区：MFA / 空闲退出可持久化；改密成功后强制重新登录（全部会话失效）
- [ ] 活动会话列表展示 `浏览器 · 系统` + IP；非当前可撤销，当前不可撤
- [ ] 无明文密码入库；无密钥提交
- [ ] UI 关键结构对齐 `design/settings.html`（分区导航 + 三 panel）

---

## 10. 实现顺序（触发编码后）

1. Entity `UserPreference` + MeModule API + 扩展 `auth/me`
2. 前端 `api/me.ts` + 类型
3. `SettingsView` 三 pane + 校验 / Toast / store 同步
4. 空闲退出 composable（可选最小实现）
5. 自测主路径；开 PR（标题含 `AIL-39`，body `Closes AIL-39` 视团队约定）

---

## 11. 与总设偏差说明

| 项 | 总设 AIL-33 | 本设计 |
|---|---|---|
| Session `label` 列 | 可选入库 | **不入库**，运行时解析 UA |
| `GET` profile | 仅 PATCH | 用扩展后的 `GET /auth/me` 代替独立 GET profile |
| MFA | UI + 入库 | 同左；文案明确「演示」 |
| 通知 | 持久化 | **真实持久化**（非纯 mock）；不发信 |
