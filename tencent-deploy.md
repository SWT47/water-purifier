# 腾讯云 CloudBase 云托管部署指南

## 项目简介

净水器直播展示系统 —— 面向抖音直播运营的产品展示后台，支持横屏后台管理模式和竖屏直播模式。

- **技术栈**：React 19 + TypeScript + Vite + Express + Drizzle ORM + PostgreSQL
- **部署方式**：Docker 容器化部署到腾讯云 CloudBase 云托管
- **服务端口**：3000

---

## 前置准备

1. **腾讯云账号**：已实名认证的腾讯云账号
2. **CloudBase 环境**：开通云开发 CloudBase，并创建一个环境（按量付费或包年包月均可）
3. **PostgreSQL 数据库**：
   - 推荐使用腾讯云 PostgreSQL（同地域内网访问更快）
   - 或使用其他可公网访问的 PostgreSQL 实例（14+ 版本）
   - 记录数据库连接串（格式：`postgresql://user:password@host:port/dbname`）
4. **代码仓库**：GitHub 或 Gitee 账号（用于代码源部署）

---

## 部署步骤

### 1. 准备代码

将本项目代码推送到 GitHub 或 Gitee 仓库：

```bash
git init
git add .
git commit -m "init: 净水器直播展示系统"
git remote add origin <你的仓库地址>
git push -u origin main
```

### 2. 登录腾讯云 CloudBase 控制台

打开 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)，选择已创建的环境。

### 3. 新建云托管服务

1. 左侧菜单选择「云托管」→「服务管理」
2. 点击「新建服务」
3. 填写服务名称（如 `water-purifier-live`）
4. 服务描述可留空
5. 点击「提交」

### 4. 选择代码源部署

1. 服务创建完成后，进入「版本管理」
2. 点击「新建版本」
3. 部署方式选择「代码源部署」
4. 点击「授权」→ 选择 GitHub 或 Gitee 进行授权

### 5. 选择仓库和分支

1. 授权成功后，选择对应的代码仓库
2. 选择部署分支（如 `main`）

### 6. 配置构建与启动

1. 构建方式选择「Dockerfile 构建」
2. Dockerfile 路径保持默认 `Dockerfile`
3. 构建目录保持默认 `./`
4. 启动命令会从 Dockerfile 的 `CMD` 自动读取，无需额外填写

### 7. 配置环境变量

在「环境变量」部分添加：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 数据库连接串 | `postgresql://user:pass@host:5432/dbname` |

> 说明：代码同时兼容 `POSTGRES_URL`，但 Docker / CloudBase 标准命名为 `DATABASE_URL`，优先使用此变量。

### 8. 端口配置

- **监听端口**：`3000`
- 协议：HTTP

### 9. 部署并访问

1. 点击「开始部署」
2. 等待构建和部署完成（首次约 3-5 分钟）
3. 部署成功后，在「服务配置」→「公网访问」中开启公网访问（或配置自定义域名）
4. 通过分配的默认域名访问系统

---

## 数据库初始化

首次部署前，需要在 PostgreSQL 数据库中执行初始化 SQL：

```bash
# 使用 psql 连接数据库并执行
psql <DATABASE_URL> -f sql/init.sql
```

或者通过数据库管理工具（如 DBeaver、Navicat、pgAdmin）直接打开 `sql/init.sql` 执行。

`sql/init.sql` 包含：
- `product` 产品表（含索引）
- `combo_scheme` 搭配方案表（含索引）
- 可选的示例数据（9 个产品 + 2 个搭配方案）

---

## 常见问题排查

### 1. 构建失败：npm install 报错

- 检查 `package.json` 是否有语法错误
- 确认 Node 版本（本项目要求 >= 22.0.0，Dockerfile 已使用 `node:22-alpine`）
- 查看构建日志中的具体错误信息

### 2. 部署后服务启动失败

- 查看「日志」中的运行日志，确认是否有报错
- 检查 `DATABASE_URL` 环境变量是否正确配置
- 确认数据库网络是否可达（同 VPC / 安全组放行）

### 3. 接口返回 500 错误

- 大概率是数据库连接问题，检查：
  - 数据库地址、端口、用户名、密码是否正确
  - 数据库是否已创建
  - 是否执行了 `sql/init.sql` 初始化脚本
- 查看服务运行日志获取详细错误信息

### 4. 页面空白 / 404

- 确认前端构建产物已正确生成（`dist/` 目录）
- 检查 Dockerfile 第二阶段是否正确复制了 `dist/` 目录
- SPA 路由刷新 404 是正常现象，已通过 `server.ts` 的 SPA fallback 处理

### 5. 端口配置错误

- 容器内监听端口必须是 `3000`（与 `server.ts` 中一致）
- 云托管服务端口配置也必须填写 `3000`
- 如需修改，同时修改 `server.ts` 的 `PORT` 环境变量和云托管端口配置

### 6. 图片 / 静态资源 404

- 静态资源通过 `express.static('dist')` 提供，路径相对于容器工作目录 `/app`
- 确认前端构建产物在 `dist/` 目录下

---

## 本地 Docker 调试

```bash
# 构建镜像
docker build -t water-purifier-live .

# 运行容器（替换为你的数据库连接串）
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  water-purifier-live

# 浏览器访问
open http://localhost:3000
```
