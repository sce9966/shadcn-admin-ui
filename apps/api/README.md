# apps/api

星枢 NovaOps 后端（NestJS + TypeORM + MySQL）。

启动、环境变量、迁移 SQL 与 API 说明见仓库根目录 **`README.md`**。

初版 Schema：`migrations/001_init_schema.sql`。

```bash
# 在仓库根目录
pnpm install
cp apps/api/.env.example apps/api/.env   # 填写 DB_* / JWT_SECRET
pnpm dev:api
```
