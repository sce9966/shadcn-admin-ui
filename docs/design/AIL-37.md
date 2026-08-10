# AIL-37 Dashboard 仪表盘页面对齐原型 — 设计文档

> Issue：AIL-37 · 父任务：AIL-32 · Stage 4  
> 原型基线：`design/dashboard.html`  
> 总设计依据：`docs/design/AIL-33.md`（§5.5 Dashboard）  
> 依赖：AIL-35（鉴权）已完成 · AIL-36（壳层）已完成  
> 仓库设计文件路径：`docs/design/AIL-37.md`  
> 状态：待评审（设计阶段 · 未编码）

---

## 1. 背景与目标

### 1.1 背景

Stage 3 已落地 JWT 鉴权与 `AdminLayout` 壳层；`/dashboard` 当前仅渲染 `DashboardPlaceholderView` 占位文案。高保真原型 `design/dashboard.html` 已定义完整内容区：页头 + 时间范围、四张 KPI、接口调用量柱状图、最近动态、快捷操作。

总设 AIL-33 已约定只读 API：`GET /api/dashboard/overview`、`GET /api/dashboard/activities`，并允许首期 seed / mock。

### 1.2 目标

1. 用 Vue + shadcn-vue / Tailwind 实现仪表盘内容区，信息层级与布局对齐原型（壳层不改）。
2. 提供 Nest 只读 Dashboard API；无真实计量源时以稳定契约返回演示数据。
3. 支持 `7d` / `30d` / `90d` 切换，刷新 KPI 与图表。
4. 加载态、空态、错误态有基本处理；路由仍为 `/dashboard`，导航 active 正确。

---

## 2. 范围 / 非范围

### 2.1 范围内（本 issue）

| 项 | 说明 |
|---|---|
| 后端模块 | `DashboardModule`：Controller / Service / DTO（Query） |
| 只读 API | `GET /api/dashboard/overview`、`GET /api/dashboard/activities` |
| Mock / Seed | 默认 mock（对齐原型 `RANGE_DATA` + `ACTIVITIES`）；可选 env 开关 |
| 前端页面 | `DashboardView` 替换占位；子组件拆分见 §6 |
| 交互 | range 切换、快捷跳转、`查看全部` → `/users` |
| 状态 | overview / activities 独立或合并请求的 loading / empty / error |
| 图表 | **纯 CSS/HTML 柱条**（对齐原型，不引入 chart 库） |
| 组件 | 按需 `shadcn-vue add card`（若尚无）；Button / Avatar / Skeleton（按需） |

### 2.2 非范围

| 项 | 说明 |
|---|---|
| 真实工单 / 存储配额 / API 网关计量 | 无上游；一律 mock（契约不变） |
| 导出审计真实下载 | 快捷操作「导出审计」：Toast 占位（AIL-33 P1） |
| 邀请抽屉完整实现 | 快捷「邀请成员」→ 跳转 `/users`（抽屉属 AIL-38） |
| 活动表写入链路 | 不在鉴权/用户管理写 activity；首期 activities 走 seed |
| 壳层 / 主题 / 守卫改动 | 已由 AIL-36 完成；本 issue 不改 Layout |
| 用户管理 / 个人设置业务页 | AIL-38 / AIL-39 |

### 2.3 假设（评审可改）

| # | 假设 | 推荐 |
|---|---|---|
| H1 | KPI / 图表 **始终**走服务端 mock 表（与原型数值一致），不强制聚合 `users` | **采纳**（工时 S、验收稳定） |
| H2 | `activities` **不建表**；Service 内静态 seed，按 `organizationId` 过滤仅作鉴权隔离（同组织返回同一列表） | **采纳**；后续可加 `activities` Entity |
| H3 | `DASHBOARD_USE_MOCK` 默认 `true`；即使为 `false`，因无真实源，Service 仍回落 mock 并打日志（契约不变） | **采纳** |
| H4 | 活跃成员 KPI **可选增强**：`activeMembers` 可改为 `COUNT(users WHERE org AND status=active)`，其余 KPI 仍 mock；首期为控范围可不做 | **首期不做**，全 mock |
| H5 | overview 响应形状以 **AIL-33 §5.5** 为准（覆盖 `ail-32-novaops-admin-template` 中略异的 `kpis`/`apiCalls` 命名） | **采纳 AIL-33** |
| H6 | activities `limit` 默认 10（对齐 AIL-33；原型 4 条 seed，limit 截断即可） | **采纳** |
| H7 | 不引入 ECharts / Chart.js；柱状图用 CSS grid + 高度百分比 | **采纳** |

---

## 3. 数据模型

### 3.1 本 issue 新增表

**无强制新增表。**

| 数据 | 存储 | 说明 |
|---|---|---|
| overview mock | 后端内存常量（按 `range`） | 对齐 `design/dashboard.html` 的 `RANGE_DATA` |
| activities seed | 后端内存常量 | 对齐原型 `ACTIVITIES` |
| JWT 上下文 | 既有 `users` / `organizations` / `sessions` | 仅用于鉴权与 org 隔离 |

### 3.2 可选后续（本 issue 不做，仅备案）

若评审要求动态可写：

#### `activities`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | bigint PK AI | |
| `organization_id` | bigint FK | 索引 `(organization_id, created_at DESC)` |
| `actor_user_id` | bigint NULL | |
| `title` | varchar(255) | |
| `subtitle` | varchar(255) NULL | |
| `actor_initial` | varchar(8) NULL | 可由 name 派生，也可冗余存 |
| `created_at` | datetime(3) | |

开发期若启用 Entity：`synchronize: true`（沿用脚手架）；正式环境再补 migration。

---

## 4. API 契约

### 4.1 约定（沿用现有）

- 前缀：`/api`
- 统一响应：`{ "code": 0, "message": "ok", "data": ... }`
- 鉴权：`Authorization: Bearer <token>`；`JwtAuthGuard`（非 Public）
- 字段：`camelCase`；时间：ISO 8601（activities 的相对时间由前端格式化，或后端直接给 `relativeTime` 展示串——见下）

### 4.2 `GET /api/dashboard/overview`

**Query**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `range` | `'7d' \| '30d' \| '90d'` | 否 | 默认 `7d`；非法值 → 400 |

**`data` 形状（锁定）：**

```json
{
  "range": "7d",
  "caption": "近 7 天 · 按小时聚合",
  "kpi": {
    "activeMembers": 128,
    "openTickets": 17,
    "loginSuccessRate": 98.6,
    "storageUsedTb": 2.4,
    "storageQuotaTb": 5
  },
  "deltas": {
    "activeMembers": { "text": "较上周 +6", "trend": "up" },
    "openTickets": { "text": "较昨日 −3", "trend": "down" },
    "loginSuccessRate": { "text": "近 24 小时", "trend": "neutral" },
    "storage": { "text": "配额 5 TB", "trend": "neutral" }
  },
  "chart": {
    "labels": ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"],
    "values": [42, 55, 48, 62, 70, 58, 66, 74, 81, 69, 77, 88]
  }
}
```

**相对 AIL-33 草案的微调（便于对齐原型 UI）：**

- 存储单位用 **TB**（原型文案 `2.4 TB` / `配额 5 TB`），避免 Gb 换算误差。
- `deltas` 改为带 `text` + `trend`（`up` | `down` | `neutral`），直接驱动 `.delta.up` / `.delta.down` 样式。
- `loginSuccessRate` 为 number；前端展示加 `%`（保留一位小数）。

**Mock 数值表（须与原型一致）：**

| range | caption | active | tickets | login | storage | chart labels 示例 |
|---|---|---|---|---|---|---|
| `7d` | 近 7 天 · 按小时聚合 | 128 | 17 | 98.6 | 2.4 / 5 | 00…22（12 点） |
| `30d` | 近 30 天 · 按日聚合 | 146 | 41 | 97.9 | 2.6 / 5 | W1…今 |
| `90d` | 近 90 天 · 按周聚合 | 162 | 93 | 97.2 | 2.9 / 5 | M1…今 |

柱序列与原型 `bars` 数组一致。

### 4.3 `GET /api/dashboard/activities`

**Query**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `limit` | number | 否 | 默认 10，最大 50 |

**`data` 形状：**

```json
{
  "items": [
    {
      "id": "1",
      "initial": "林",
      "title": "林晓加入「运营」角色",
      "subtitle": "由陈思远审批 · 14:22",
      "occurredAt": "2026-08-10T01:10:00.000Z",
      "relativeTime": "12 分钟前"
    }
  ]
}
```

**说明：**

- `relativeTime` 可由后端按固定演示串返回（seed 场景更稳），或前端用 `occurredAt` 计算；**首期推荐后端直接给原型文案**，避免时钟漂移导致验收不一致。
- 列表空时 `items: []`（前端空态）。

### 4.4 错误

| 场景 | HTTP | 说明 |
|---|---|---|
| 未登录 / token 无效 | 401 | 既有过滤器 |
| `range` 非法 | 400 | `message` 提示合法枚举 |
| `limit` 非法 | 400 | |

权限：所有已登录角色（admin / ops / viewer）均可读（对齐 AIL-33 矩阵）。

---

## 5. 关键流程

```text
已登录用户进入 /dashboard
  → 并行请求 overview(range=当前) + activities(limit=10)
  → loading：KPI / 图表 / 动态区 Skeleton 或脉冲占位
  → 成功：渲染四卡 + 柱图 + 动态列表 + 快捷区
  → 失败：区域内错误文案 +「重试」按钮（不整页白屏）

切换 range pills
  → 仅重新请求 overview（activities 不变）
  → 图表区保持高度，避免布局跳动

点击「查看全部」或快捷「邀请成员」
  → router.push('/users')

快捷「导出审计」
  → toast.info（占位，不调 API）

快捷「安全设置」
  → router.push('/settings')  （AIL-39 落地前可为占位页）
```

---

## 6. 前端页面 / 交互要点

### 6.1 路由

| 项 | 约定 |
|---|---|
| path | `dashboard`（已有，挂在 `AdminLayout` 下） |
| name | `dashboard` |
| component | `@/views/dashboard/DashboardView.vue`（替换 `DashboardPlaceholderView`） |
| meta | `{ title: '仪表盘', nav: 'dashboard' }` 保持不变 |

顶栏标题 / 面包屑仍由壳层根据 `meta.title` 渲染；页面内另有 `h1`「今日运营概览」（对齐原型 `page-head`）。

### 6.2 目录建议

```text
apps/web/src/
  api/dashboard.ts
  types/dashboard.ts
  views/dashboard/
    DashboardView.vue
  components/dashboard/
    DashboardPageHead.vue    # 标题 + range pills
    KpiGrid.vue
    TrafficChart.vue         # CSS 柱状图
    ActivityList.vue
    QuickActions.vue
```

### 6.3 UI 结构（对齐原型）

1. **Page head**：标题「今日运营概览」+ 副文案「生产环境 · 上海时区 · 数据截至刚才」+ range pills（近 7 / 30 / 90 天）
2. **KPI 四卡**：活跃成员、待处理工单、登录成功率、存储占用；delta 着色
3. **双栏**：左「接口调用量」面板（caption + 柱图 + axis）；右「最近动态」（头像字 + title/sub + 相对时间）；「查看全部」链到用户管理
4. **快捷操作**：三格 — 邀请成员 / 导出审计 / 安全设置

### 6.4 视觉与组件

- 复用现有 CSS 变量 / Tailwind token（`surface`、`border`、`muted`、`accent` 等映射到 shadcn theme）
- KPI / Panel：优先 `Card`；若未安装则 `shadcn-vue add card`
- Range pills：可用 `Button` variant 或自定义 inline-flex（样式贴近原型，不必强行 Tabs）
- Avatar：已有 `components/ui/avatar`
- **响应式**：桌面 `kpi` 四列、`layout-2` 为 `1.4fr 1fr`；`<lg` 时 KPI 两列、双栏单列（基础可用即可）
- **不动**侧栏 / 顶栏结构

### 6.5 加载 / 空 / 错

| 状态 | 行为 |
|---|---|
| Loading | KPI 四卡 Skeleton；图表区固定高度占位；动态列表 3～4 行骨架 |
| Empty（activities） | 「暂无最近动态」居中弱文案 |
| Empty（overview） | 理论上 mock 必有数据；若异常当 error |
| Error | 文案 + 重试；range 切换失败保留上一份成功数据（可选，推荐） |

### 6.6 前端依赖

- **不新增**图表库
- HTTP：沿用 `@/api/http` + Bearer 拦截器
- 无强制 Pinia store；页面内 `ref` + 请求函数即可（数据只读、无跨页共享）

---

## 7. 后端实现要点

```text
apps/api/src/modules/dashboard/
  dashboard.module.ts
  dashboard.controller.ts
  dashboard.service.ts
  dto/overview-query.dto.ts
  dto/activities-query.dto.ts
  data/dashboard-mock.ts      # RANGE_DATA + ACTIVITIES 常量
```

- `DashboardController`：`@Controller('dashboard')`；方法返回裸 `data`，由既有 `TransformInterceptor` 包一层
- `DashboardService.getOverview(range)` / `getActivities(limit)`
- 注册到 `AppModule.imports`
- 环境变量（写入 `.env.example`，仅变量名）：`DASHBOARD_USE_MOCK=true`

---

## 8. 风险与待决

| 风险 / 待决 | 影响 | 缓解 |
|---|---|---|
| AIL-33 与 ail-32 模板文档 overview 字段名不一致 | 联调歧义 | **本设计锁定 §4.2**；实现与评审以此为准 |
| Mock 被误认为生产指标 | 验收误解 | README / 页面副文案可保留「演示数据」语义；env 标明 mock |
| 与 AIL-38 并行改 `AppModule` / 路由 | 合并冲突 | 文件触点小；Dashboard 独立 module / view 目录 |
| 「导出审计」无后端 | 交互空洞 | Toast 明确「即将推出」类文案 |

**待决（最多 2 问，见评论）：**

1. activities 是否坚持「内存 seed、不建表」（推荐），还是本 issue 一并加 `activities` Entity + seed 插入？
2. `activeMembers` 是否要接真实 `COUNT(active users)`，还是与原型完全一致的固定 mock？

若评审未回复，按 **H2 + H4（全 mock、不建表）** 实现。

---

## 9. 验收标准

- [ ] `/dashboard` 在壳层内展示：页头 + range、四 KPI、调用量图、最近动态、快捷操作，结构对齐 `design/dashboard.html`
- [ ] 切换 7d / 30d / 90d 时 KPI 数值、caption、柱图与 axis 同步变化（数值对齐原型表）
- [ ] `GET /api/dashboard/overview`、`GET /api/dashboard/activities` 需登录；统一响应结构
- [ ] 加载态 / 动态空态 / 请求失败有基本处理
- [ ] 「查看全部」「邀请成员」进入 `/users`；「安全设置」进入 `/settings`；「导出审计」Toast 占位
- [ ] 侧栏「仪表盘」active；未登录访问仍被守卫拦截
- [ ] 无密钥提交；未引入无关新栈（无 chart 库）

---

## 10. 实现顺序（评审通过且 @ 全栈工程师后）

1. 后端：`dashboard-mock` 常量 → Service → Controller → 模块注册 → 手工/curl 验 API  
2. 前端：`types` + `api/dashboard.ts` → 子组件 → `DashboardView` → 换路由 component  
3. 联调：登录 → 仪表盘 → 切 range → 快捷跳转 → 加载/错误态  
4. 自测清单勾选 §9；开/更新 PR（标题含 `AIL-37`）

---

## 11. 与总设偏差说明

| 点 | 总设 / 其它文档 | 本设计 |
|---|---|---|
| 存储单位 | AIL-33 曾用 `storageUsedGb` | 改为 TB，贴近原型文案 |
| deltas | AIL-33 为简单字符串 map | 增 `trend` 枚举，便于样式 |
| activities 表 | AIL-33「可分期」 | 首期不建表，内存 seed |
| ail-32 `kpis`/`apiCalls` | 并行草案 | **不采用**，以本 §4.2 为准 |
