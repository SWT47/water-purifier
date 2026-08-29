# 净水器直播展示系统 — Vercel 部署版

> 完全独立部署版本，支持 Vercel + PostgreSQL，内置 14 条产品示例数据，接口失败时自动降级到静态数据，开箱即用。

面向抖音直播运营场景的净水器产品展示与搭配方案管理系统。支持横屏后台管理模式和竖屏直播展示模式，产品多维度筛选、对比、搭配方案云端保存与跨设备同步。

---

## ✨ 功能特性

- **产品库管理**：六大类目（净水器、管线机、前置过滤器、大白瓶、中央净水机、中央软水机），20+ 产品参数
- **智能筛选**：按类目、品牌、关键词、在售状态多维筛选 + 分页
- **产品对比**：多产品参数横向对比
- **搭配方案**：跨类目搭配组合，保存方案，直播一键切换
- **横屏模式**：产品列表 + 筛选 + 详情 + 对比 + 搭配方案编辑 + Excel 批量导入
- **竖屏直播模式**：沉浸式产品展示 + 直播价醒目强调 + 搭配方案快速切换
- **静态数据降级**：接口请求失败时自动使用内置静态数据（14 条产品示例），零配置即可体验
- **图片/视频展示**：产品白底图、实景图、视频

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| 后端 | Vercel Serverless Functions + Drizzle ORM |
| 数据库 | PostgreSQL（Vercel Postgres / Supabase / Neon / 自建均可） |
| 图片存储 | Vercel Blob（可选），默认使用 picsum 占位图 |
| 路由 | React Router v6 |
| 拖拽 | @dnd-kit |
| 图标 | Lucide React |

---

## 🚀 部署步骤

### 第一步：准备工作

1. 注册 [GitHub](https://github.com/signup) 账号（免费）
2. 注册 [Vercel](https://vercel.com/signup) 账号（可用 GitHub 直接登录，免费额度足够使用）
3. 准备 PostgreSQL 数据库（推荐 [Neon](https://neon.tech/) 免费版，或使用 Vercel Postgres）

### 第二步：上传代码到 GitHub

1. 下载本项目 ZIP 压缩包并解压
2. 在 GitHub 上新建仓库（New Repository），名称如 `water-purifier-live`
3. 将解压后的代码 push 到仓库

```bash
cd water-purifier-live
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/你的用户名/water-purifier-live.git
git push -u origin main
```

也可以直接使用 Vercel CLI 部署，不需要 GitHub：

```bash
npm install -g vercel
vercel deploy --prod
```

### 第三步：在 Vercel 中导入项目

1. 登录 Vercel，点击 **Add New...** → **Project**
2. 在 **Import Git Repository** 中找到你的 GitHub 仓库，点击 **Import**
3. **Project Name**：自定义项目名称
4. **Framework Preset**：选择 **Vite**
5. 其余保持默认即可

### 第四步：配置环境变量

在 Vercel 项目 → **Settings** → **Environment Variables** 中添加：

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | 否（不填则使用静态数据） |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token，用于图片上传 | 否 |

数据库连接字符串格式：
```
postgresql://user:password@host:5432/dbname?sslmode=require
```

> 💡 **提示**：即使不配置数据库，应用也能正常运行——前端接口请求失败时会自动降级到内置的 14 条静态产品数据。

### 第五步：初始化数据库（配置了 DATABASE_URL 才需要）

如果配置了数据库，需要初始化表结构：

#### 方式 A：本地执行 Drizzle Push（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 DATABASE_URL

# 3. 推送表结构
npm run db:push
```

#### 方式 B：手动执行 SQL

1. 在数据库管理工具中打开 `sql/init.sql`
2. 复制全部 SQL 语句并执行

### 第六步：部署

1. 在 Vercel 项目页面点击 **Deploy**
2. 等待部署完成，点击 **Visit** 即可访问

🎉 **部署完成！** 你的应用地址是 `https://<你的项目名>.vercel.app`

---

## 💻 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量（可选，不配置则使用静态数据）
cp .env.example .env.local
# 编辑 .env.local，填入 DATABASE_URL

# 初始化数据库（可选）
npm run db:push

# 启动 Vercel 开发环境（前端 + Serverless Functions）
npm run dev
# 前端默认 http://localhost:3000
# API 同域 /api/*
```

也可以分开启动：

```bash
# 仅前端 dev server
npx vite

# 后端 Serverless Functions（另开终端）
vercel dev
```

构建生产版本：

```bash
npm run build
```

---

## ⚙️ 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 数据库连接字符串 | 空（使用静态数据） |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob 读写 Token | 空 |

---

## 📁 项目结构

```
.
├── api/                          # Vercel Serverless Functions
│   ├── products.ts               # 产品列表 + 创建
│   ├── products/
│   │   ├── [id].ts               # 产品详情 + 更新 + 删除
│   │   └── compare.ts            # 产品对比
│   ├── combo-schemes.ts          # 方案列表 + 创建
│   └── combo-schemes/
│       └── [id].ts               # 方案更新 + 删除
├── src/                          # 前端 React 应用
│   ├── pages/                    # 页面组件
│   ├── components/
│   │   └── ui/                   # UI 组件库
│   ├── api/                      # 前端 API 调用
│   │   ├── products.ts           # 产品 API（带 fallback）
│   │   ├── products-static.ts    # 产品静态数据 API
│   │   ├── combo-schemes.ts      # 搭配方案 API（带 fallback）
│   │   └── combo-schemes-static.ts # 搭配方案静态数据 API
│   ├── data/
│   │   └── products.json         # 内置静态产品数据（14 条）
│   ├── utils/                    # 工具函数
│   ├── types/                    # 类型定义
│   ├── store/                    # 状态管理
│   ├── app.tsx                   # 路由配置
│   └── main.tsx                  # 入口
├── db/                           # 数据库 Schema
├── sql/
│   └── init.sql                  # 数据库初始化脚本
├── index.html
├── package.json
├── vite.config.ts
├── vercel.json
└── README.md
```

---

## 📱 页面路由

| 路径 | 页面 | 模式 | 说明 |
|------|------|------|------|
| `/` | 首页 | - | 跳转到净水器类目 |
| `/products/:category` | 产品库 | 横屏 | 产品列表+筛选+增删改+导入 |
| `/products/detail/:id` | 产品详情 | 横屏 | 产品参数详情+图片 |
| `/compare` | 产品对比 | 横屏 | 多产品横向对比 |
| `/combo` | 搭配方案 | 横屏 | 跨类目搭配+保存方案 |
| `/live/:category` | 直播展示 | 竖屏 | 沉浸式产品直播展示 |
| `/live-combo` | 直播搭配 | 竖屏 | 搭配方案直播展示 |

---

## 🗄️ 数据库

### 表结构

#### product（产品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| category | varchar(50) | 产品类目 |
| brand | varchar(255) | 品牌 |
| name | varchar(255) | 名称 |
| model | varchar(255) | 型号 |
| white_bg_image | text | 白底图 URL |
| daily_price | numeric | 日常价 |
| reference_price | numeric | 参考价/直播价 |
| flux | varchar(100) | 通量 |
| water_flow_rate | varchar(100) | 水流量 |
| real_images | text[] | 实景图列表 |
| real_videos | text[] | 视频列表 |
| ... | ... | 其他 20+ 参数 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

#### combo_scheme（搭配方案表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar(200) | 方案名称 |
| product_ids | uuid[] | 产品ID列表 |
| live_price | numeric | 直播优惠价 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

### 数据库迁移

```bash
# 生成迁移文件
npm run db:generate

# 执行迁移
npm run db:migrate

# 直接推送 schema（开发环境）
npm run db:push
```

---

## 🖼️ 图片存储

当前版本中，产品图片和视频以 **URL 字符串** 形式存储。你可以使用以下方式管理图片：

### 方案一：picsum 占位图（默认）
内置示例数据使用 picsum.photos 占位图，开箱即用，无需配置。

### 方案二：Vercel Blob
在 Vercel Storage 中创建 Blob 存储，配置 `BLOB_READ_WRITE_TOKEN` 环境变量后可直接上传图片。

### 方案三：免费图床
- [sm.ms](https://sm.ms) — 免费图床
- [Imgur](https://imgur.com) — 国外图床
- 上传图片后，将图片 URL 填入产品的"白底图"或"实景图"字段

### 方案四：云存储服务
- 阿里云 OSS / 腾讯云 COS / 七牛云
- 自建 MinIO（私有化部署）

---

## 🌐 自定义域名

1. 在 Vercel 项目 → **Settings** → **Domains**
2. 输入你的域名，点击 **Add**
3. 按提示在域名服务商处配置 DNS 解析
4. Vercel 会自动配置 HTTPS 证书

---

## ❓ 常见问题

### 数据库连接失败
- 检查 `DATABASE_URL` 格式是否正确
- 确认数据库服务是否开启 SSL（大多数云数据库需要 `?sslmode=require`）
- 检查网络防火墙是否允许连接
- 无需数据库也能正常使用——前端会自动降级到静态数据

### 图片不显示
- 确认 Vercel Blob 配置（如使用）
- 默认使用 picsum.photos 占位图，确保网络可以访问
- 检查图片 URL 是否有效

### API 404
- 检查 `vercel.json` 中的 rewrites 配置
- 确认 `api/` 目录下的文件路径与请求路径匹配
- Vercel Serverless Functions 的文件名即路由路径

### 接口报错但页面还能正常显示
这是正常现象——前端读接口失败时会自动降级到内置静态数据。打开浏览器控制台可以看到 `console.warn` 降级日志。

---

## 🔒 安全说明

- 当前版本所有接口为公开访问，任何人都可以增删改产品和搭配方案
- 产品管理功能（增删改/导入）建议接入认证后使用
- 如需限制访问，可接入以下方案：
  - Clerk / Auth0 等第三方身份认证服务
  - 简单的管理密码（前端弹窗输入，后端校验 token）
  - Vercel 的 Protection Bypass 功能

---

## 📄 License

MIT
