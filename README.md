# 星枢 NovaOps · shadcn-admin 开发模板

基于 Vue 3 + NestJS + TypeORM + MySQL + shadcn-vue 的企业中后台脚手架。
高保真原型见 `design/`，设计文档见 `docs/design/AIL-33.md`。

## 仓库结构

```text
.
├── apps/web          # Vue 3 SPA（Vite + Tailwind + shadcn-vue）
├── apps/api          # NestJS API（TypeORM + MySQL）
├── design/           # 高保真 HTML 原型
└── docs/design/      # 评审通过的设计文档
```

## 环境要求

- Node.js >= 20
- pnpm >= 9
- MySQL 8+（业务开发 / TypeORM 联调需要）

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备数据库

```sql
CREATE DATABASE novaops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

复制环境变量示例并按需修改：

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. 启动

```bash
# 终端 1 — API（默认 http://localhost:3000）
pnpm dev:api

# 终端 2 — Web（默认 http://localhost:5173，/api 代理到 3000）
pnpm dev:web
```

健康检查：`GET http://localhost:3000/api/health`（需 MySQL 已启动且库已创建，API 启动时会连接 TypeORM）。

## 环境变量（仅变量名说明）

### `apps/api/.env`

| 变量 | 用途 |
|------|------|
| `NODE_ENV` | `development` 时 TypeORM `synchronize=true`；生产必须 `false` 并用迁移 |
| `PORT` | API 端口，默认 `3000` |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL 连接（默认库名 `novaops`） |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | JWT（Stage 3 鉴权使用） |
| `CORS_ORIGIN` | CORS 允许源，默认 `http://localhost:5173` |
| `DASHBOARD_USE_MOCK` | 仪表盘 mock 开关（后续 Stage） |

### `apps/web/.env`

| 变量 | 用途 |
|------|------|
| `VITE_API_BASE_URL` | API 前缀，开发默认 `/api`（走 Vite 代理） |

**请勿提交真实密钥或 `.env` 文件。**

## CORS / 开发代理

- API：`enableCors`，源来自 `CORS_ORIGIN`
- Web：`vite.config.ts` 将 `/api` 代理到 `http://localhost:3000`

## TypeORM 策略

- 开发：`synchronize: true`（`NODE_ENV=development`）
- 生产：关闭 synchronize，使用 migration（后续 Stage 补充脚本）
- 脚手架阶段尚无业务 Entity；连接成功即表示 MySQL 配置正确

## shadcn-vue

前端已 `components.json` 初始化，示例组件：`apps/web/src/components/ui/button`。

```bash
cd apps/web
pnpm dlx shadcn-vue@latest add <component>
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev:web` | 启动前端 |
| `pnpm dev:api` | 启动后端 |
| `pnpm build:web` | 构建前端 |
| `pnpm build:api` | 构建后端 |

## 当前 Stage 范围（AIL-34）

已完成：monorepo 骨架、路由占位、统一响应 / 异常、TypeORM 配置、README 与 env 示例。

未包含：业务鉴权、管理壳层、Dashboard / 用户 / 设置页面（Stage 3+）。
