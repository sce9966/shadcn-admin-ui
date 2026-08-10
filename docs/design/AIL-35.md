# AIL-35 设计：登录注册 API 与 Auth 页面

> Issue：AIL-35 · 父任务：AIL-32 · 总设：`docs/design/AIL-33.md`  
> 原型基线：`design/auth.html`  
> 依赖：AIL-34 脚手架已落地（`apps/web` + `apps/api`，统一响应、TypeORM、路由占位）  
> 状态：**评审通过并实现中**（2026-08-07 @全栈工程师）· 假设按推荐落地：邮箱全局唯一、`1d` / `14d`

---

## 1. 背景与目标

### 1.1 背景

仓库已具备 monorepo 脚手架与 Auth 占位页（`AuthPlaceholderView`），尚无 User / Organization / Session 实体与鉴权 API。总设 AIL-33 已锁定 JWT + Session、注册建组织、路由 `/auth` 等契约；本 issue 将其收敛为可联调的鉴权闭环。

### 1.2 目标

1. 落地鉴权所需最小数据模型（Organization / User / Session）与开发期同步策略。
2. 实现注册、登录、当前用户、登出 API，DTO 校验与错误文案对齐原型。
3. 用 Vue + shadcn-vue 实现 Auth 页（登录 / 注册 Tab），视觉与交互对齐 `design/auth.html`。
4. 登录成功进入后台路由（现阶段可进 Dashboard 占位）；未登录访问受保护路由被拦截。

---

## 2. 范围与非范围

### 2.1 范围内（本 issue）

| 域 | 内容 |
|---|---|
| 数据 | `organizations`、`users`、`sessions` Entity；开发期 `synchronize: true`（沿用脚手架）；提供可选 migration 脚本说明（可不在本 issue 强制落地完整 migration 流水线） |
| API | `POST /api/auth/register`、`POST /api/auth/login`、`POST /api/auth/logout`、`GET /api/auth/me` |
| 鉴权 | JWT HS256；`JwtAuthGuard`（白名单：auth 公开接口 + health）；Session `jti` 吊销校验；bcrypt 密码哈希 |
| 前端 | `AuthLayout` + `AuthView`（替换占位）；Pinia `useAuthStore`；`api/auth.ts`；路由守卫（`meta.public`）；token 注入（沿用现有 axios 拦截器） |
| 交互 | Tab 切换、字段校验、错误 Alert、密码显隐、忘记密码 Toast、记住登录 14 天 |

### 2.2 非范围（本 issue 不做）

| 项 | 说明 |
|---|---|
| Admin 壳层 / 主题完整实现 | 属 AIL-36；登录后跳转现有 Dashboard **占位**即可 |
| 用户管理邀请 / 启停 API 与页 | AIL-38 |
| 个人设置、改密、会话列表 UI | AIL-39（本 issue 仅在登出时吊销当前 session） |
| Refresh Token、OAuth、SSO、真实邮件重置 | 总设已排除 |
| 邀请接受落地页 | 总设已确认不做 |
| `user_preferences` / `activities` | 延后到设置 / 仪表盘 issue；注册不强制建偏好行 |

### 2.3 假设（评审可改）

1. **邮箱登录查找**：登录仅传 `email`，实现时对 `users.email` 增加**全局唯一**索引（在总设「组织内唯一」之上收紧），避免多组织同邮箱歧义。若评审要求严格仅组织内唯一，则登录失败文案改为「请联系管理员确认工作区」。
2. **Token 存储键**：与脚手架一致，使用 `localStorage` / `sessionStorage` 键名 **`novaops_access_token`**（覆盖总设中的 `novaops_token` 笔误）。
3. **记住登录**：`remember=true` → `localStorage` + `JWT_REMEMBER_EXPIRES_IN`（默认 `14d`）；否则 → `sessionStorage` + `JWT_EXPIRES_IN`（默认 `1d`）。实现时修正脚手架 `.env.example` 中 `JWT_EXPIRES_IN=7d` → `1d`，并新增 `JWT_REMEMBER_EXPIRES_IN`。
4. **并行 AIL-36**：本 issue 自带最小路由守卫；壳层美化不阻塞鉴权验收。
5. **停用账号演示**：种子或手工将某用户 `status=disabled` 即可复现原型 `demo@blocked.com` 行为；不强制内置该邮箱种子（可选 seed）。

---

## 3. 数据模型

### 3.1 ER（本 issue）

```text
Organization 1──* User
User 1──* Session
```

### 3.2 表与字段

#### `organizations`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `name` | varchar(128) | 公司/工作区名称（注册 `orgName`） |
| `slug` | varchar(64) UNIQUE NULL | 由 name 生成（小写 + 连字符；冲突时后缀数字） |
| `created_at` / `updated_at` | datetime | |

#### `users`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `organization_id` | bigint FK NOT NULL | 索引 |
| `email` | varchar(255) NOT NULL | **全局唯一**（本 issue 假设） |
| `password_hash` | varchar(255) NOT NULL | bcrypt；注册必填 |
| `name` | varchar(64) | |
| `title` | varchar(128) NULL | 默认 null |
| `bio` | text NULL | |
| `role` | enum(`admin`,`ops`,`viewer`) | 注册创建者 = `admin` |
| `status` | enum(`active`,`invited`,`disabled`) | 注册 = `active` |
| `invite_note` / `invite_expires_at` | 预留 | 本 issue 不写 |
| `last_login_at` | datetime NULL | 登录成功更新 |
| `mfa_enabled` / `idle_logout` | tinyint | 默认 0 / 1；本 issue 不暴露写接口 |
| `created_at` / `updated_at` | datetime | |

**索引**：`uk_users_email (email)`；`idx_users_org (organization_id)`；保留 `uk_users_org_email` 亦可（全局唯一已覆盖）。

#### `sessions`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `user_id` | bigint FK | 索引 |
| `token_jti` | varchar(64) UNIQUE | JWT `jti` |
| `user_agent` | varchar(512) NULL | 登录时从请求头写入 |
| `ip` | varchar(64) NULL | 可选 |
| `expires_at` | datetime | |
| `revoked_at` | datetime NULL | logout / 改密时写入 |
| `created_at` | datetime | |

索引：`idx_sessions_user (user_id, revoked_at)`。

### 3.3 同步策略

- 开发：继续 `NODE_ENV=development` → `synchronize: true`（脚手架已有）。
- 生产：禁止 synchronize；migration 可在联调阶段（AIL-40）或本 issue 附带 `docs`/`scripts` 说明，**不强制本 issue 引入完整 migration 流水线**（与总设一致）。
- **禁止**明文密码或 `JWT_SECRET` 入库。

---

## 4. API 契约

### 4.1 约定（沿用脚手架）

- 前缀：`/api`
- 成功：`{ "code": 0, "message": "ok", "data": ... }`（`TransformInterceptor`）
- 失败：HTTP 4xx/5xx + `{ "code": <非0>, "message": "...", "data": null }`
- 鉴权头：`Authorization: Bearer <accessToken>`
- 字段：`camelCase`；时间 ISO 8601；id 以字符串返回避免 JS 精度问题（假设）

### 4.2 端点

| 方法 | 路径 | 鉴权 | Body |
|---|---|---|---|
| POST | `/api/auth/register` | 公开 | `{ name, orgName, email, password }` |
| POST | `/api/auth/login` | 公开 | `{ email, password, remember?: boolean }` |
| POST | `/api/auth/logout` | 需登录 | — |
| GET | `/api/auth/me` | 需登录 | — |
| GET | `/api/health` | 公开 | —（已有） |

`confirm` / `terms` **仅前端校验**，不入 API。

### 4.3 成功 `data`（register / login 同形）

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
    "title": null,
    "organization": { "id": "1", "name": "星海科技" }
  }
}
```

`GET /me` 的 `data` 为上述 `user` 对象（无 token）。

### 4.4 DTO 校验

| 字段 | 规则 |
|---|---|
| `email` | 必填；基础 email |
| `password`（登录） | 必填；`MinLength(8)` |
| `password`（注册） | 必填；`MinLength(8)` + 同时含字母与数字（`Matches(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)`） |
| `name` | 必填；trim 后长度 ≥ 2 |
| `orgName` | 必填；trim 后长度 ≥ 2 |
| `remember` | 可选 boolean |

### 4.5 业务错误（文案对齐原型）

| 场景 | HTTP | message（建议） |
|---|---|---|
| 邮箱已注册 | 409 | 该邮箱已被注册 |
| 邮箱或密码错误 | 401 | 邮箱或密码不正确 |
| `status=disabled` | 403 | 该账号已被停用，请联系工作区管理员。 |
| `status=invited` | 403 | 邀请尚未激活，请联系工作区管理员。 |
| Token 无效 / Session 已吊销 | 401 | 未登录或登录已失效 |
| DTO 校验失败 | 400 | 校验信息拼接（管道默认） |

登录失败**不区分**「邮箱不存在 / 密码错」，统一「邮箱或密码不正确」。

### 4.6 JWT Payload

| Claim | 含义 |
|---|---|
| `sub` | userId（string） |
| `org` | organizationId |
| `role` | 角色 |
| `jti` | 会话唯一 id（写入 `sessions.token_jti`） |
| `exp` | 过期 |

校验顺序：签名与过期 → 查 session by jti 且 `revoked_at IS NULL` 且未过期 → 加载用户且 `status=active`。

---

## 5. 后端模块结构（`apps/api`）

```text
src/
  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/login.dto.ts
      dto/register.dto.ts
      strategies/jwt.strategy.ts
      guards/jwt-auth.guard.ts
      decorators/public.decorator.ts
      decorators/current-user.decorator.ts
    users/          # 仅 Entity 也可放 entities/ 公共目录；本 issue 不暴露 UsersController
  entities/
    organization.entity.ts
    user.entity.ts
    session.entity.ts
```

实现要点：

1. `@Public()` 标记 register/login/health；全局 `APP_GUARD` 注册 `JwtAuthGuard`。
2. `register`：事务内创建 Organization + User(admin, active) + Session，签发 JWT。
3. `login`：校验密码与状态 → 新建 Session → 更新 `last_login_at` → 签发 JWT。
4. `logout`：按 jti 写 `revoked_at`；前端同时清本地 token。
5. 密码：`bcrypt.hash` / `compare`，cost ≥ 10；响应与日志永不回传 `password` / `passwordHash`。
6. 依赖：`@nestjs/jwt`、`@nestjs/passport`、`passport-jwt`、`bcrypt`（或 `bcryptjs`）。

---

## 6. 前端页面与交互

### 6.1 路由

| 路径 | 行为 |
|---|---|
| `/auth` | 公开；已登录则重定向 `/dashboard`（或 `?redirect=`） |
| `/` | 有 token → `/dashboard`，否则 `/auth`（脚手架已有，守卫加固） |
| `/dashboard` 等 | `meta.public !== true` → 无 token 跳转 `/auth?redirect=<path>` |

登录成功：`router.replace(redirect || '/dashboard')`。

### 6.2 目录与组件

```text
apps/web/src/
  layouts/AuthLayout.vue          # 左视觉 + 右 520px 表单栏
  views/auth/AuthView.vue         # Tab + 两表单（替换 AuthPlaceholderView）
  stores/auth.ts
  api/auth.ts
  components/ui/...               # 按需 shadcn-vue：input, label, checkbox, tabs（button 已有）
```

### 6.3 对齐 `design/auth.html` 要点

| 原型 | 实现 |
|---|---|
| 左右分栏（1fr / 520px）；小屏可叠成单栏 | AuthLayout + Tailwind；桌面优先 |
| 左：eyebrow / 标题 / lead / 三项 meta | 静态文案，与原型一致 |
| 右：品牌标 + Tab 登录/注册 | Tabs 或按钮组 `is-active` |
| 登录字段：邮箱、密码、记住 14 天、忘记密码 | 忘记密码 → Toast「已向管理员发送重置指引（演示）」 |
| 注册：姓名+公司两列、邮箱、密码、确认、条款 | confirm/terms 仅前端 |
| 字段 `is-invalid` + 顶部 Alert | 对齐原型文案 |
| 密码显隐按钮 | 切换 input type |
| 成功 Toast 后进仪表盘 | sonner / 简易 toast（与项目现有能力对齐；无则轻量自研） |

校验规则与原型脚本一致：

- 登录：email 格式；密码 ≥ 8
- 注册：姓名/公司 ≥ 2；密码字母+数字且 ≥ 8；确认一致；必须勾选条款

### 6.4 Pinia `useAuthStore`

- 状态：`user`、`accessToken`（内存 + storage 同步）
- 动作：`login`、`register`、`logout`、`fetchMe`、`hydrateFromStorage`
- 应用启动：`main.ts` 若有 token 则 `fetchMe`（失败则清会话）
- HTTP：沿用 `novaops_access_token`；响应 `401` → 清会话并跳转 `/auth?redirect=`

---

## 7. 关键流程

### 7.1 注册

```text
填写注册表（前端校验）
  → POST /api/auth/register
  → 事务：Organization + User(admin,active) + Session
  → 返回 accessToken + user
  → 前端持久化 token → Toast → /dashboard
```

### 7.2 登录

```text
POST /api/auth/login { email, password, remember }
  → 查用户；无或密码错 → 401
  → disabled / invited → 403 + 固定文案
  → 写 Session + JWT → 更新 last_login_at
  → 前端按 remember 选 storage → /dashboard
```

### 7.3 受保护访问

```text
请求带 Bearer
  → JwtAuthGuard：验签 + session 未吊销 + user active
  → 失败 401；前端跳转 /auth
```

### 7.4 登出

```text
POST /api/auth/logout → revoked_at
  → 前端清 token → /auth
```

---

## 8. 环境变量（仅名）

| 变量 | 用途 | 本 issue 动作 |
|---|---|---|
| `JWT_SECRET` | 签名密钥 | 已有；README 提醒必改 |
| `JWT_EXPIRES_IN` | 默认过期 | `.env.example` 改为 `1d` |
| `JWT_REMEMBER_EXPIRES_IN` | 记住登录 | **新增**，默认 `14d` |
| `DB_*` / `CORS_ORIGIN` / `VITE_API_BASE_URL` | 已有 | 不变 |

---

## 9. 风险与待决

| 项 | 说明 | 状态 |
|---|---|---|
| 邮箱全局唯一 vs 组织内唯一 | 见 §2.3 假设 1 | **按推荐落地：全局唯一**（评审通过未提出异议） |
| 与 AIL-36 路由守卫重复 | 本 issue 先落地最小守卫；AIL-36 可复用/增强，避免双份逻辑 | 假设可接受 |
| Auth 页视觉像素级还原 | 以信息结构与交互为准；token 走现有 shadcn CSS 变量 | 假设 |
| MySQL 本地可用性 | 联调依赖本地 MySQL；无法连库时注明未测 | 风险 |

### 聚焦问题（最多 2 个）

1. **登录邮箱是否采用全局唯一？**（推荐：是，便于无 org 上下文登录）
2. **默认 token 有效期是否确认 `1d` / 记住 `14d`？**（将覆盖当前 `.env.example` 的 `7d`）

---

## 10. 验收标准

- [ ] 注册 / 登录 API 可用，DTO 校验完整（class-validator）
- [ ] 密码仅存 bcrypt 哈希；响应/库中无明文密码、无密钥入库
- [ ] `GET /me`、`POST /logout` 在有效 token 下可用；logout 后 token 失效
- [ ] Auth 页：Tab、校验、Alert、密码显隐、忘记密码 Toast、记住登录，对齐 `design/auth.html` 关键结构
- [ ] 登录/注册成功进入 `/dashboard`（可为占位页）
- [ ] 未登录访问 `/dashboard`、`/users`、`/settings` 被拦截并跳转 `/auth`
- [ ] `disabled` 用户登录返回停用文案（可用手工改库或可选 seed 验证）
- [ ] 设计文档路径：`docs/design/AIL-35.md`；实现仅在评审通过且评论 **@ 全栈工程师** 后开始

---

## 11. 实现顺序（触发后）

1. Entity + AuthModule（register/login/me/logout + Guard）
2. 环境变量与依赖补齐
3. 前端 API + Store + 路由守卫
4. AuthLayout / AuthView 对齐原型
5. 本地联调与边界自测；开 PR（`Closes AIL-35`）

---

## 12. 修订记录

| 日期 | 说明 |
|---|---|
| 2026-08-07 | 初稿：对照 AIL-33、脚手架现状与 `design/auth.html` |
| 2026-08-07 | 评审通过并 @ 开工；按推荐假设实现（邮箱全局唯一、JWT 1d/14d） |
