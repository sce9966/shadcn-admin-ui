# AIL-40 设计：联调、视觉对照与 README 交付

> Issue：AIL-40 · 父任务：AIL-32 · 总设：`docs/design/AIL-33.md`  
> 依赖：Stage 4 全部完成（AIL-37 / AIL-38 / AIL-39）  
> 仓库设计文件路径：`docs/design/AIL-40.md`  
> 状态：**待评审**（设计阶段；评审通过且评论 @ 全栈工程师后才执行联调 / 修缺陷 / README 落地）

---

## 1. 背景与目标

### 1.1 背景

Stage 1–4 已交付：脚手架、鉴权、管理壳层、仪表盘、用户管理、个人设置。根 `README.md` 仍停留在 AIL-34 脚手架口径（「当前 Stage 范围」未覆盖完整主路径）。本 issue 为 Stage 5 收口：端到端联调、对照 `design/` 做视觉 / 交互验收、完善 README 与演示数据说明，使仓库可作为可用的开发模板交接。

### 1.2 目标

1. 主路径端到端可走通：注册 / 登录 → 仪表盘 → 用户管理 → 设置 → 登出。
2. 关键页面与 `design/` 无**明显结构偏差**（信息架构、分区、工具栏 / 表格 / 抽屉等；不锁死 1920×1080 画布）。
3. README 可供新人按文档启动（架构、env 变量名、迁移 / 启动、与 `design/` 对照、演示数据、已知问题）。
4. 输出已知问题清单；父 issue [AIL-32](mention://issue/8c744f54-cfda-45c4-a991-986142dceb95) 可据此转评审或关闭。

### 1.3 本阶段门禁

- **本评论 / 本文件仅为验收执行设计**，不写业务代码、不改 Entity / API / UI（允许后续实现阶段按评审结论做**最小必要**缺陷修复与文档提交）。
- 评审通过后，请在评论中 **@ 全栈工程师** 再触发联调与交付；仅有「通过 / LGTM」而无 @ → 不开工。

---

## 2. 范围与非范围

### 2.1 范围内

| 域 | 内容 |
|---|---|
| E2E 联调 | 主路径 + 错误态 / 权限边界冒烟（见 §6） |
| 视觉对照 | `/auth` `/dashboard` `/users` `/settings` 对照对应 HTML 原型结构清单（见 §5） |
| README | 重写根 `README.md`：架构、env、启动、演示数据、design 对照、已知问题；同步修正过时「仅脚手架」表述 |
| 演示数据说明 | 注册首个 admin 的路径；仪表盘 mock（`DASHBOARD_USE_MOCK`）；停用账号登录拒绝的复现步骤 |
| 缺陷修复 | 仅修联调中发现的 **P0 阻塞主路径** 问题；P1/P2 记入已知问题，不扩大功能范围 |
| Migration 说明 | 文档写清：开发 `synchronize=true`；生产须 migration。若仓库仍无 migration 脚本，实现阶段补**最小初版 migration 生成/说明**（见 H2） |

### 2.2 非范围

| 项 | 说明 |
|---|---|
| 生产部署 / CI 流水线 | 除非总设后续 issue 纳入；本 issue 不建 GitHub Actions |
| 新业务能力 | 不做邀请接受落地页、真实邮件、MFA 绑定、CSV 导出、多租户切换等总设范围外项 |
| 像素级还原 | 不追求与固定画布原型逐像素一致；以信息结构与关键交互为准 |
| 自动化 E2E 套件 | 首期以手工 / curl 清单验收；不强制引入 Playwright/Cypress（可作后续增强） |
| 大范围重构 | 不为「顺手」改目录、换栈、统一风格无关文件 |

### 2.3 假设（评审可改）

| # | 假设 | 推荐 |
|---|---|---|
| H1 | 联调默认使用本地 MySQL + 开发 synchronize；不依赖生产库 | **采用** |
| H2 | 生产 migration：实现阶段若尚无 `apps/api` migration，则补充「如何生成 / 如何跑」的 README 步骤，并尽量提交一版与当前 Entity 对齐的初版 migration；若生成环境缺 MySQL 导致无法生成，则 README 明确「开发 synchronize + 生产需自行 `typeorm migration:generate`」为已知限制 | **采用** |
| H3 | 演示数据：**不强制**内置 seed 账号；以「注册创建工作区」为主路径。停用登录用手工改库或邀请后改 `status=disabled` 复现（对齐 AIL-35） | **采用** |
| H4 | 仪表盘 KPI / 动态继续全 mock（AIL-37 H2/H4）；README 标明「演示数据」 | **采用** |
| H5 | 列表页对 `ops`/`viewer`：可浏览；邀请 / 启停仅 `admin`（403 + Toast）——冒烟覆盖此边界 | **采用** |
| H6 | 发现非阻塞视觉差异 → 记入「已知问题」；仅主路径不可用或与原型结构明显冲突才改代码 | **采用** |

---

## 3. 数据模型（验收视角）

本 issue **不新增业务表**。沿用已落地模型（详见 AIL-33 / AIL-35 / AIL-38 / AIL-39）：

```text
Organization 1──* User
User 1──* Session
User 1──1 UserPreference
```

| 表 | 验收关注点 |
|---|---|
| `organizations` | 注册创建；壳层副标题展示 org 名 |
| `users` | 角色 `admin/ops/viewer`；状态 `active/invited/disabled`；邀请 / 启停 |
| `sessions` | 登录签发、登出吊销、设置页会话列表与撤销、改密吊销全部 |
| `user_preferences` | 通知偏好读写持久化 |

**索引（已有，验收不改）**：组织内邮箱唯一、`organization_id` 等按既有 Entity。

**演示数据（文档级，非强制 seed）**：

1. 新人：`POST /api/auth/register` 或前端 `/auth` 注册 → 自动成为该 Org 的 `admin`。
2. 仪表盘：`DASHBOARD_USE_MOCK=true`（默认）→ 固定 KPI / 图表 / 动态文案。
3. 停用登录：将某用户 `status` 置为 `disabled` 后登录 → 业务错误文案（对齐原型 blocked 行为）。

---

## 4. API 契约（冒烟清单）

统一响应：`{ code, message, data }`（与现网一致）。实现阶段联调按下列接口冒烟，**不改契约**（除非 P0 缺陷必须修）。

### 4.1 鉴权

| 方法 | 路径 | 验收要点 |
|---|---|---|
| POST | `/api/auth/register` | 创建 org + admin；返回 token |
| POST | `/api/auth/login` | 成功签发；`disabled` / `invited` 拒绝 |
| GET | `/api/auth/me` | Bearer 有效；资料字段可用 |
| POST | `/api/auth/logout` | 吊销当前会话 |

### 4.2 仪表盘

| 方法 | 路径 | 验收要点 |
|---|---|---|
| GET | `/api/dashboard/overview?range=` | `7d/30d/90d`；mock 有数据 |
| GET | `/api/dashboard/activities` | 列表非空（seed） |

### 4.3 用户管理

| 方法 | 路径 | 验收要点 |
|---|---|---|
| GET | `/api/users` | 分页 / 关键词 / role / status |
| POST | `/api/users/invites` | 仅 admin；创建 `invited` |
| POST | `/api/users/:id/resend-invite` | 仅 admin |
| PATCH | `/api/users/:id/status` | 仅 admin；禁停自己 |

### 4.4 个人设置（Me）

| 方法 | 路径 | 验收要点 |
|---|---|---|
| PATCH | `/api/me/profile` | 资料保存反馈 |
| GET/PATCH | `/api/me/preferences` | 通知偏好持久化 |
| PATCH | `/api/me/security` | MFA / 空闲退出开关 |
| POST | `/api/me/password` | 改密后强制重登 |
| GET | `/api/me/sessions` | 会话列表 |
| DELETE | `/api/me/sessions/:id` | 不可撤当前会话 |

### 4.5 健康检查

| GET | `/api/health` | 启动后可用（依赖 MySQL） |

---

## 5. 前端页面 / 交互要点（视觉对照）

对照基线：`design/auth.html`、`design/dashboard.html`、`design/users.html`、`design/settings.html`；壳层见 `design/js/layout.js` + `design/css/admin.css`。

| 路由 | 原型 | 结构检查项 |
|---|---|---|
| `/auth` | `auth.html` | 左右分栏；登录 / 注册切换；校验与错误提示；成功进 `/dashboard` |
| `/dashboard` | `dashboard.html` | KPI 区、range 切换、图表区、最近动态、快捷入口；壳层导航活跃态 |
| `/users` | `users.html` | 工具栏（搜索 / 筛选 / 邀请）、表格列、邀请抽屉、行内启停 / 重发、Toast |
| `/settings` | `settings.html` | 三分区导航（profile / notify / security）；表单保存反馈；改密与会话 |
| 壳层 | layout | 侧栏 240px 量级、顶栏面包屑 / 主题 / 用户菜单、登出 |

**判定标准**：信息层级与关键控件齐全；无整页级结构缺失。间距 / 字号轻微差异记已知问题，不阻塞交付。

---

## 6. 关键流程（E2E 剧本）

### 6.1 主路径（P0）

```text
1. 准备 MySQL 库 novaops → 复制 .env.example → pnpm install
2. pnpm dev:api / pnpm dev:web
3. 打开 /auth → 注册（name / orgName / email / password）→ 进入 /dashboard
4. 仪表盘切换 7d/30d/90d，确认 KPI / 动态有数据
5. 进入 /users → 邀请成员 → 列表可见 invited →（可选）重发邀请
6. 进入 /settings → 改资料保存 → 改通知开关 → 查看会话
7. 用户菜单登出 → 回到 /auth；未登录访问 /dashboard 被拦
8. 再次登录同一账号成功
```

### 6.2 错误态 / 权限冒烟（P0）

| 场景 | 期望 |
|---|---|
| 错误密码登录 | 明确错误提示，不进入后台 |
| `disabled` 用户登录 | 拒绝 + 停用文案 |
| 未登录访问受保护路由 | 跳转 `/auth`（带 redirect 更佳，有则验） |
| 非 admin 调邀请 / 启停 | 403；前端 Toast / 禁用入口 |
| 停用当前登录用户 | API 拒绝 |
| 改密成功 | 清 token，需重新登录 |

### 6.3 交付物（实现阶段）

1. 更新后的根 `README.md`（见 §7 大纲）。
2. （可选）`docs/known-issues.md` **或** README 内「已知问题」专节（二选一，推荐 README 专节以免散落）。
3. 联调记录摘要（issue 交付评论）：通过项 / 未测项 / 与设计偏差 / 已知问题。
4. 若有代码修复：开/更新 PR，标题含 `AIL-40`。

---

## 7. README 目标大纲（实现时落地）

根 `README.md` 建议结构（替换过时 Stage 范围段）：

1. **简介**：星枢 NovaOps 模板 + 技术栈一行。
2. **仓库结构**：`apps/web`、`apps/api`、`design/`、`docs/design/`。
3. **环境要求**：Node ≥ 20、pnpm ≥ 9、MySQL 8+。
4. **快速开始**：建库 → 复制 env → `pnpm install` → `dev:api` / `dev:web`。
5. **环境变量表**：仅变量名与用途（api / web）；强调勿提交密钥。
6. **TypeORM / 迁移**：开发 synchronize；生产 migration 步骤或限制说明（H2）。
7. **演示数据**：注册即 admin；仪表盘 mock；如何复现停用登录。
8. **主路径与页面对照**：路由 ↔ `design/*.html` 表。
9. **权限摘要**：admin vs ops/viewer。
10. **脚本表**、`shadcn-vue` 补充组件方式。
11. **已知问题**清单（联调后填写）。
12. **设计文档索引**：AIL-33 总设 + 各 stage 设计路径。

`apps/web/README.md` / `apps/api/README.md`：保持简短，指向根 README，避免三处漂移。

---

## 8. 风险与待决事项

| 风险 | 影响 | 缓解 |
|---|---|---|
| 本地无 MySQL / 字符集问题 | 无法联调 | 文档写清建库 SQL；联调失败则标未测项并 `blocked` 或带已知环境限制交付 |
| README 与多份设计文档不一致 | 新人困惑 | README 只保留启动真相；细节链到 `docs/design/` |
| 视觉主观争议 | 验收扯皮 | 以 §5 结构清单为准，像素差记已知问题 |
| Migration 无法在无 DB 环境生成 | 生产指引缺口 | 按 H2 降级为文档说明 |
| Stage 4 PR 未全部合并到默认分支 | 联调基线漂移 | 实现前确认默认分支已含 AIL-37/38/39；否则基于已合并主线或注明基线 commit |

### 待决（最多两个聚焦问题）

1. **H2**：是否必须在本 issue 提交可执行的初版 TypeORM migration 文件，还是 README 说明「开发 synchronize + 生产自行 generate」即可？  
   - 未回复时默认：**尽量提交初版 migration；若环境不允许则文档降级**。
2. **H3**：是否需要仓库内置演示 seed（含 `disabled` 演示用户），还是维持「注册即用 + 手工改状态」？  
   - 未回复时默认：**不内置 seed**，README 写清复现步骤。

---

## 9. 实现阶段工作顺序（触发后）

1. 确认默认分支含 Stage 4 功能；拉齐 env 示例与脚本。
2. 本地启动 API/Web，按 §6.1 / §6.2 执行联调并记录结果。
3. 按 §5 做视觉结构对照，汇总偏差。
4. P0 缺陷最小修复（若有）。
5. 按 §7 重写 README；落实 H2 migration 结论。
6. 提交 PR（`AIL-40`）→ issue 交付评论（验证步骤、偏差、已知问题、设计路径）。

---

## 10. 验收标准（对照 issue）

- [ ] 主路径联调通过（§6.1）
- [ ] 关键页面与 `design/` 无明显结构偏差（§5）
- [ ] README 可供新人按文档启动（§7）
- [ ] 已知问题清单已写入 README（或约定文档）
- [ ] 父 issue 可据此关闭或转评审
- [ ] （过程）设计已双写；实现仅在 @ 全栈工程师后开始

---

## 11. 参考

| 文档 / 资源 | 路径或说明 |
|---|---|
| 总设 | `docs/design/AIL-33.md` |
| 鉴权 / 壳层 / 功能设 | `docs/design/AIL-35.md` … `AIL-39.md` |
| 高保真原型 | `design/*.html` |
| 既有 PR（Stage 参考） | AIL-34 #2、AIL-36 #3、AIL-35 #4、AIL-38 #5、AIL-37 #6、AIL-39 #7 |
