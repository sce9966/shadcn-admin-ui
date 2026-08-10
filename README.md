# 星枢 NovaOps · shadcn-admin 开发模板

基于 **Vue 3 + NestJS + TypeORM + MySQL + shadcn-vue** 的企业中后台脚手架。  
高保真原型见 `design/`，设计文档见 `docs/design/`（总设 `docs/design/AIL-33.md`）。

## 仓库结构

```text
.
├── apps/web          # Vue 3 SPA（Vite + Tailwind + shadcn-vue）
├── apps/api          # NestJS API（TypeORM + MySQL）
├── design/           # 高保真 HTML 原型
├── docs/design/      # 各 Stage 设计文档
└── apps/api/migrations/  # 生产可用初版 Schema SQL
```

## 环境要求

- Node.js >= 20
- pnpm >= 9
- MySQL 8+（本机联调已在 MySQL 5.7+ 验证可通）

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备数据库

```sql
CREATE DATABASE novaops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

复制环境变量示例（**勿提交真实 `.env` / 密钥**）：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

按需修改 `apps/api/.env` 中的 `DB_*` 与 `JWT_SECRET`。

### 3. 启动

```bash
# 终端 1 — API（默认 http://localhost:3000）
pnpm dev:api

# 终端 2 — Web（默认 http://localhost:5173，/api 代理到 3000）
pnpm dev:web
```

健康检查：`GET http://localhost:3000/api/health`（需 MySQL 已启动且库已创建）。

开发期 `NODE_ENV=development` 时 TypeORM **`synchronize=true`**，启动后自动建表。

## 环境变量（仅变量名说明）

### `apps/api/.env`

| 变量 | 用途 |
|------|------|
| `NODE_ENV` | `development` → TypeORM `synchronize=true`；生产须 `production` 并关闭 synchronize |
| `PORT` | API 端口，默认 `3000` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL 连接（默认库名 `novaops`） |
| `JWT_SECRET` | JWT 签名密钥（必改） |
| `JWT_EXPIRES_IN` | 默认过期，如 `1d` |
| `JWT_REMEMBER_EXPIRES_IN` | 记住登录过期，如 `14d` |
| `CORS_ORIGIN` | CORS 允许源，默认 `http://localhost:5173` |
| `DASHBOARD_USE_MOCK` | 仪表盘演示数据开关；无真实上游时即使为 `false` 也会回落 mock |

### `apps/web/.env`

| 变量 | 用途 |
|------|------|
| `VITE_API_BASE_URL` | API 前缀，开发默认 `/api`（走 Vite 代理） |
| `VITE_SHELL_DEV_BYPASS_AUTH` | 仅本地预览壳层时跳过守卫（默认关闭；勿在生产开启） |

## TypeORM / 迁移

| 环境 | 策略 |
|------|------|
| 开发 | `synchronize: true`（由 `NODE_ENV=development` 控制） |
| 生产 | `NODE_ENV=production` → **关闭 synchronize**；先建库再执行初版 SQL |

初版 Schema（与当前 Entity 对齐）：

```bash
mysql -u <user> -p novaops < apps/api/migrations/001_init_schema.sql
```

后续若 Entity 变更，建议在可连库的环境自行生成差分 migration，或手工追加 SQL；本仓库以 `001_init_schema.sql` 作为可运行基线（H2）。

## 演示数据

- **不内置 seed 账号**（H3）。打开 `/auth` → **注册**：创建 Organization，当前用户为该工作区 `admin`。
- **仪表盘**：默认 `DASHBOARD_USE_MOCK=true`，KPI / 图表 / 最近动态为演示数据（对齐原型数值）。
- **停用账号登录拒绝**：将某用户 `users.status` 改为 `disabled` 后尝试登录，应返回停用相关错误（对齐原型 blocked 行为）。示例：

```sql
UPDATE users SET status = 'disabled' WHERE email = 'someone@example.com';
```

## 主路径与页面对照

| 产品路由 | 原型 | 说明 |
|----------|------|------|
| `/auth` | `design/auth.html` | 登录 / 注册 |
| `/dashboard` | `design/dashboard.html` | KPI、图表、动态 |
| `/users` | `design/users.html` | 列表 / 筛选 / 邀请 / 启停 |
| `/settings` | `design/settings.html` | 资料 / 通知 / 安全（`?tab=`） |
| `/` | — | 已登录 → `/dashboard`，否则 → `/auth` |
| （无路由） | `design/index.html` | 仅原型导览，不作为产品页 |

### 推荐主路径

注册 / 登录 → 仪表盘（切换 7d/30d/90d）→ 用户管理（邀请成员）→ 设置（改资料 / 通知）→ 登出。

### 权限摘要

| 角色 | 能力 |
|------|------|
| `admin` | 全部：邀请、重发邀请、启停成员 |
| `ops` / `viewer` | 可浏览用户列表等只读能力；邀请 / 启停返回 403 |

## CORS / 开发代理

- API：`enableCors`，源来自 `CORS_ORIGIN`
- Web：`vite.config.ts` 将 `/api` 代理到 `http://localhost:3000`

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev:web` | 启动前端 |
| `pnpm dev:api` | 启动后端 |
| `pnpm build:web` / `pnpm build:api` | 分别构建 |
| `pnpm build` | 全仓构建 |
| `pnpm lint` | 全仓 lint |

## shadcn-vue

前端已在 `apps/web` 初始化，组件位于 `apps/web/src/components/ui`。

```bash
cd apps/web
pnpm dlx shadcn-vue@latest add <component>
```

## 已知问题

| 项 | 说明 |
|----|------|
| 像素级差异 | 产品为桌面优先响应式，不锁死原型 1920×1080 画布；以信息结构与关键交互对齐为准 |
| 邀请接受落地页 | 首期不做邮件落地 / 设密激活；邀请仅创建 `invited` + Toast |
| 真实邮件 / MFA / CSV 导出 | 按总设范围外：偏好持久化、MFA 开关演示、导出 Toast 占位 |
| 仪表盘指标 | 无真实上游，始终为演示 / mock 数据 |
| `UsersPlaceholderView.vue` | 遗留占位文件，路由已指向真实 `UsersView`，可后续删除 |
| TypeORM 包版本 | 依赖声明为 `typeorm@^1.1.0`（与常见 `0.3.x` 文档示例不同）；开发 synchronize 与本地联调可用，生产请优先跑 `migrations/001_init_schema.sql` |

## 设计文档索引

| 文档 | 内容 |
|------|------|
| `docs/design/AIL-33.md` | 总设 |
| `docs/design/AIL-35.md` | 鉴权 |
| `docs/design/AIL-36.md` | 壳层 |
| `docs/design/AIL-37.md` | 仪表盘 |
| `docs/design/AIL-38.md` | 用户管理 |
| `docs/design/AIL-39.md` | 个人设置 |
| `docs/design/AIL-40.md` | Stage 5 验收 / README 交付 |

子应用 README（`apps/web`、`apps/api`）仅作指向，**以本根 README 为准**。
