# AIL-36 管理后台壳层、主题与路由守卫 — 设计文档

> Issue：AIL-36 · 父任务：AIL-32 · 并行：AIL-35（鉴权）  
> 原型基线：`design/js/layout.js`、`design/css/admin.css`（`.shell` / `.sidebar` / `.topbar`）  
> 总设计依据：`docs/design/AIL-33.md`  
> 仓库设计文件路径：`docs/design/AIL-36.md`  
> 状态：待评审（通过后请评论 @ 全栈工程师，再开始编码）

---

## 1. 背景与目标

### 1.1 背景

Stage 2 脚手架（AIL-34）已落地：`apps/web` 具备路由占位页、Pinia、Axios、`globals.css` token，但**尚无 Admin 壳层布局**——各业务占位页各自渲染，无统一侧栏 / 顶栏。高保真原型通过 `design/js/layout.js` 注入/增强 `.shell`，产品实现需用 Vue 布局组件等价落地。

本任务与 AIL-35（鉴权）同属 Stage 3、可并行：壳层负责布局与导航；鉴权负责登录态与 JWT。双方通过**约定好的 token 键、auth store 接口、路由 `meta`** 对接。

### 1.2 目标

1. 落地 `AdminLayout`：侧栏 + 顶栏 + 内容区，视觉与信息架构对齐原型。
2. 导航：仪表盘 / 用户管理 / 个人设置；路由跳转与 active 态正确。
3. 明暗主题切换，持久化，并与 shadcn-vue CSS 变量一致。
4. 提供 Vue Router 守卫接入点，与 AIL-35 鉴权契约对齐；未登录无法进入受保护页。
5. 业务内容区保持占位，供 Stage 4 功能页替换。

---

## 2. 范围 / 非范围

### 2.1 范围内（本 issue）

| 项 | 说明 |
|---|---|
| Admin 布局 | `AdminLayout` + `AppSidebar` + `AppTopbar` + `UserMenu` + `ThemeToggle` |
| 路由骨架 | 受保护子路由挂到 Admin 布局下；`/auth` 保持独立（Auth 页由 AIL-35） |
| 导航配置 | 对齐原型分组「总览 / 组织」与三项菜单 |
| 主题 | light / dark；`localStorage` 持久化；启动时无闪烁应用 |
| Toast | 主题切换、通知占位（vue-sonner） |
| 用户菜单 | 个人设置跳转、退出登录（调用 auth store / 清 token） |
| 路由守卫 | `beforeEach`：`meta.public` / 需登录；`redirect` query |
| 占位页 | Dashboard / Users / Settings 改为壳内空内容占位（标题由顶栏承担） |
| shadcn 组件 | 按需 `add`：DropdownMenu、Breadcrumb、Avatar、Separator、Sonner 等（Button 已有） |
| Token 映射 | 侧栏宽 / 顶栏高等 layout 常量写入 CSS；主题色对齐已有 `globals.css` |

### 2.2 非范围

| 项 | 说明 |
|---|---|
| Auth 页 UI / 注册登录 API | **AIL-35** |
| Nest 后端 Entity / JWT 签发 | **AIL-35**（本 issue 前端仅消费 token） |
| Dashboard / Users / Settings 业务 UI | Stage 4（AIL-37/38/39） |
| 顶栏全局搜索 | AIL-33 已确认首期不做 |
| 真实通知中心 | 通知铃仅 Toast 占位 |
| 移动端完整适配 / 折叠侧栏动画精修 | 桌面优先；小屏做基础可用即可 |
| `design/index.html` 入口导览 | 产品不做该路由 |

### 2.3 假设（评审可改）

| # | 假设 |
|---|---|
| H1 | Token 键名以脚手架为准：`novaops_access_token`（覆盖 AIL-33 草案中的 `novaops_token`）；remember 用 `localStorage`，非 remember 用 `sessionStorage`（由 AIL-35 写入，守卫双读） |
| H2 | 主题同时设置 `document.documentElement.dataset.theme`（对齐原型）与 `classList` 的 `dark`（对齐 shadcn `@custom-variant dark`） |
| H3 | 主题 storage key：`novaops-theme`（与原型一致） |
| H4 | 用户菜单展示名 / 邮箱：优先读 Pinia `useAuthStore`；鉴权未就绪时显示占位「访客 / —」，不阻塞壳层开发 |
| H5 | 品牌副标题：`{orgName} · 生产环境`；无 org 时用「星海科技 · 生产环境」 |
| H6 | 本 issue **不改** Nest 后端；纯前端壳层 + 守卫 |
| H7 | 与 AIL-35 并行时：壳层先合入「读 token + 守卫」；AIL-35 补齐 login/logout/me 后共用同一 store 接口 |

---

## 3. 数据模型

本 issue **无新增数据库表**。

| 数据 | 存储 | 说明 |
|---|---|---|
| 主题 | `localStorage['novaops-theme']` = `light` \| `dark` | 客户端 |
| Access Token | `localStorage` / `sessionStorage` `novaops_access_token` | AIL-35 写入；守卫与 http 拦截器读取 |
| 当前用户 | Pinia `auth`（内存 + 可选 hydration） | 字段契约见 §4 / AIL-35 |

---

## 4. API 契约（壳层消费面）

本 issue 不新增 REST。壳层依赖鉴权侧（AIL-35）约定：

| 能力 | 约定 | 壳层用法 |
|---|---|---|
| 是否已登录 | 存在有效 `novaops_access_token`（双 storage 查找） | 路由守卫 |
| 当前用户 | `GET /api/auth/me`（AIL-35）；响应统一 `{ code, message, data }` | 用户菜单头像字、姓名、邮箱；org 名 |
| 登出 | `POST /api/auth/logout`（可选）+ 清本地 token | 用户菜单「退出登录」→ `/auth` |
| HTTP 401 | 已有 axios 实例需增强：清会话并 `router.push('/auth?redirect=')` | 与守卫一致 |

**壳层实现时：**

- 提供 `stores/auth.ts` 的**最小接口**（若 AIL-35 尚未合入则本 issue 建 stub，AIL-35 扩展实现）：

```ts
/** 鉴权 store 最小契约（AIL-35 / AIL-36 共用） */
interface AuthStoreContract {
  token: string | null
  user: { id: number; name: string; email: string; role: string; organizationName?: string } | null
  isAuthenticated: boolean
  /** 从 storage 恢复 token；可选拉 /me */
  hydrate: () => Promise<void>
  logout: () => Promise<void>
}
```

- 若 `/me` 失败或未实现：菜单用占位文案，**不**因此拆掉壳层。

---

## 5. 前端页面 / 交互要点

### 5.1 路由结构（目标）

```text
/                    → 登录态分流（已有；守卫增强）
/auth                → AuthPlaceholder / AuthView（public，AIL-35）
/ (AdminLayout)
  ├─ /dashboard      → DashboardPlaceholder → 后换 DashboardView
  ├─ /users          → UsersPlaceholder → 后换 UsersView
  └─ /settings       → SettingsPlaceholder → 后换 SettingsView
```

建议实现方式：

```ts
{
  path: '/',
  component: AdminLayout,
  meta: { requiresAuth: true },
  children: [
    { path: 'dashboard', name: 'dashboard', component: ..., meta: { title: '仪表盘', nav: 'dashboard' } },
    { path: 'users', name: 'users', component: ..., meta: { title: '用户管理', nav: 'users' } },
    { path: 'settings', name: 'settings', component: ..., meta: { title: '个人设置', nav: 'settings' } },
  ],
}
// `/` redirect 仍按 token → dashboard | auth
// `/auth` 独立，meta.public = true
```

### 5.2 导航配置（对齐 `layout.js` NAV_ITEMS）

| id | 分组 | 文案 | path | 图标 |
|---|---|---|---|---|
| dashboard | 总览 | 仪表盘 | `/dashboard` | LayoutDashboard |
| users | 组织 | 用户管理 | `/users` | Users |
| settings | 组织 | 个人设置 | `/settings` | Settings |

Active：`route.meta.nav === item.id` 或 `route.path` 前缀匹配。

### 5.3 布局结构（对齐原型 DOM）

```text
.shell (grid: 240px 1fr; min-h-screen)
├─ aside.sidebar
│  ├─ brand（N 标 + 星枢 NovaOps + 副标题）
│  └─ nav（nav-label + nav-item）
└─ div.main
   ├─ header.topbar
   │  ├─ left: breadcrumb（首页 / 当前）+ title
   │  └─ actions: ThemeToggle | Notify | UserMenu
   └─ main.content → <RouterView />
```

尺寸常量：`--sidebar-w: 240px`；`--topbar-h: 64px`（写入 `globals.css` 或 layout 专用 CSS）。

### 5.4 主题交互

1. 应用启动（`main.ts` 最早或 `useTheme` 的 sync）：读 `novaops-theme`，默认 `light`。
2. 写 `data-theme` + `html.dark` class。
3. 顶栏按钮切换 → Toast「已切换为深色/浅色主题」。
4. 图标：浅色显示太阳、深色显示月亮（lucide），`aria-pressed` 对齐原型。

### 5.5 用户菜单 / 通知

- 触发：仅头像按钮（对齐原型）。
- 菜单项：个人设置 → `/settings`；分隔线；退出登录（危险样式）→ `auth.logout()` → `/auth`。
- 通知：点击 Toast「有 3 条未读通知：2 条审批 · 1 条安全告警」（演示文案同原型）。

### 5.6 面包屑

- `首页`：点击行为 → 已登录跳转 `/dashboard`（不做 `index.html` 导览）。
- 当前页：`route.meta.title`。

### 5.7 响应式（桌面优先）

| 断点 | 行为 |
|---|---|
| ≥ 1024px | 固定 240px 侧栏 |
| < 1024px | 侧栏改为 Sheet/抽屉，顶栏增加「打开菜单」按钮；内容全宽 |

不做原型 1920×1080 画布锁定。

### 5.8 目录与组件

```text
apps/web/src/
  layouts/AdminLayout.vue
  components/layout/
    AppSidebar.vue
    AppTopbar.vue
    AppUserMenu.vue
    ThemeToggle.vue
    nav.ts                 # NAV_ITEMS 配置
  composables/useTheme.ts
  stores/auth.ts           # stub 或与 AIL-35 共用
  stores/theme.ts          # 可选；也可用 composable
  router/index.ts          # 布局嵌套 + beforeEach
  router/guards.ts         # 守卫逻辑抽出
  views/*PlaceholderView.vue  # 瘦身为内容占位
```

**样式策略：** 优先 Tailwind + 语义色（`bg-background`、`bg-primary` 等）；壳层关键结构可用少量自定义 class 对齐原型间距，**不**整文件拷贝 `admin.css`。

**shadcn-vue 新增（实现时按需）：** `dropdown-menu`、`breadcrumb`、`avatar`、`separator`、`sonner`、`sheet`（小屏侧栏）。

---

## 6. 关键流程

### 6.1 受保护路由访问

```text
进入 /dashboard|users|settings
  → beforeEach
  → 无 token？→ /auth?redirect=<fullPath>
  → 有 token → 放行；AdminLayout 挂载
  →（可选）auth.hydrate() 拉 /me 填充用户菜单
```

### 6.2 已登录访问 /auth

```text
有 token → 重定向 /dashboard（或 redirect query 若合法且非 auth）
```

### 6.3 主题切换

```text
点击 ThemeToggle → 切换 light/dark → 写 storage + DOM → Toast
```

### 6.4 退出

```text
UserMenu「退出登录」→ auth.logout()（清 token，可选调 API）→ /auth
```

### 6.5 与 AIL-35 并行集成顺序

```text
1. AIL-36：布局 + 主题 + 守卫（读 token）+ auth stub
2. AIL-35：Auth 页 + API + 充实 auth store（login/register/me/logout）
3. 联调：登录 → 壳层显示真实用户 → 退出回到 Auth
```

合并冲突预期点：`router/index.ts`、`stores/auth.ts`、`api/http.ts`（401 处理）——实现时保持接口稳定、小步提交。

---

## 7. 风险与待决事项

| 风险 | 影响 | 缓解 |
|---|---|---|
| AIL-35 / AIL-36 同时改 router、auth store | 合并冲突 | 本文锁定契约；auth store 先 stub |
| Token 键名与 AIL-33 草案不一致 | 守卫读错键 | **以脚手架 `novaops_access_token` 为准**，实现时同步修订 AIL-33 提及处 |
| 主题 `data-theme` vs `.dark` 双轨 | 样式不生效 | 切换时两者同步写 |
| 无真实用户时菜单空白 | 体验差 | 占位文案；不阻塞导航 |
| 小屏 Sheet 与原型不一致 | 验收争议 | 验收以桌面为主；小屏标为「基本可用」 |

### 待决（最多 2 问，请评审回复）

1. **并行期是否允许「开发旁路」？** 例如仅本地 `VITE_SHELL_DEV_BYPASS_AUTH=true` 时跳过守卫以便单独预览壳层；默认关闭。是否接受？
2. **小屏侧栏：** Sheet 抽屉（推荐）还是简单隐藏侧栏、仅顶栏+内容（更省事）？

未回复时默认：**接受旁路 env（默认关）**；小屏用 **Sheet**。

---

## 8. 验收标准

- [ ] 桌面视口呈现侧栏 + 顶栏 + 内容区，结构对齐 `design/` 壳层（品牌、分组导航、面包屑、标题、主题/通知/用户菜单）
- [ ] 三项导航跳转正确，当前路由 active 态正确（高对比/主色底）
- [ ] 主题切换即时生效，刷新后保持；Toast 提示
- [ ] 用户菜单可进入设置、可退出（清 token 后进 `/auth`）
- [ ] 未登录访问 `/dashboard`（等）被重定向到 `/auth?redirect=...`
- [ ] 已登录访问 `/auth` 重定向到 `/dashboard`
- [ ] `globals.css` / 语义色与原型 token 大致一致（黑白 accent、圆角 ~8px、侧栏 240、顶栏 64）
- [ ] 占位页仅内容区文案，不再自带整页临时导航条
- [ ] 窄屏下导航仍可达（Sheet 或等价）
- [ ] 无新增后端密钥；不扩大 Stage 4 业务页范围

---

## 9. 实现备注（评审通过且 @ 后执行）

1. 只读对照 `design/dashboard.html` 静态壳 + `layout.js`，用 Vue 组件重写，不引入 jQuery/原型脚本。
2. diff 尽量小：改 router、加 layouts/components、瘦占位页、补 shadcn 组件与 sonner。
3. 自测：`pnpm --filter web build`；手工点导航 / 主题 / 守卫（可用临时写入 token）。
4. 交付：PR（标题含 `AIL-36`）+ issue 评论说明验证步骤；与设计偏差单独列出。

---

## 10. 评审说明

请确认本文档（尤其 §2.3 假设、§7 两个待决问题的默认值）。  
**评审通过后请在本 issue 评论中 @ 全栈工程师，我再开始编码。**  
仅有「通过 / LGTM」但未 @ → 按门禁不得开工。
